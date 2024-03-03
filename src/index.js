#!/usr/bin/env node
// 引入必要的模块
import axios from 'axios';
import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';

// 初始化命令行工具
const program = new Command();
program.version('1.0.0')
    .option('-u, --url <url>', 'figma file url')
    .option('-t, --accessToken <accessToken>', 'figma access token')
    .option('-p, --imageSavePath [imageSavePath]', 'figma file images save path', './figma/images')
    .option('-i, --ignoreNodeName [ignoreNodeName]', 'ignore node name')
    .option('-s, --scale [scale]', 'A number between 0.01 and 4, the image scaling factor', 2)
    .option('-f, --format [format]', 'A string enum for the image output format, can be jpg, png, svg, or pdf', 'png')
    .action(async (options) => {
        console.log('options:', options);
        // 检查必要参数
        if (!options.url || !options.accessToken) {
            console.error('URL and accessToken are required');
            process.exit(1);
        }

        // 解析文件和页面ID
        const { fileId, pageId } = getFileIdByURL(options.url);
        console.log(`fileId: ${fileId}, pageId: ${pageId}`);
        options.fileId = fileId;
        options.pageId = pageId;

        // 下载Figma信息
        await downloadFigmaInfo(options);
    })
    .parse(process.argv);

// 从URL中解析文件ID和页面ID
function getFileIdByURL(urlStr) {
    const url = new URL(urlStr);
    const pathname = url.pathname;
    const fileId = pathname.split('/file/')[1].split('/')[0];
    const pageId = url.searchParams.get('node-id').split('-').join(':');
    return { fileId, pageId };
}

// 下载Figma文件信息
async function downloadFigmaInfo(options) {
    const { fileId, pageId, accessToken, imageSavePath } = options;
    try {
        console.log(chalk.blue('开始下载文件信息...'));
        const response = await axios.get(`https://api.figma.com/v1/files/${fileId}`, {
            headers: { 'X-Figma-Token': accessToken }
        });

        console.log(chalk.green('获取到Figma文件内容...'));
        const fileContent = response.data.document;

        // 过滤出指定页面的FRAME类型节点
        const nodesToRender = fileContent.children
            .filter((item) => item.id === pageId)
            .flatMap((item) => item.children.filter((child) => child.type === 'FRAME'));

        console.log(chalk.yellow('检查目录是否存在，不存在则创建目录...'));
        await fs.ensureDir(imageSavePath);
        console.log(chalk.green(`目录 ${imageSavePath} 已存在或已创建。`));

        // 导出图片
        await exportImages(nodesToRender, options);
    } catch (error) {
        console.error('下载Figma文件信息出错:', error);
    }
}

// 导出图片
async function exportImages(nodesToRender, options) {
    if (!nodesToRender.length) {
        console.log(chalk.red('必须指定要渲染的节点。'));
        process.exit(1);
    }

    const { fileId, accessToken, scale, imageSavePath, format } = options;
    try {
        console.log(chalk.blue('开始导出图片...'));

        // 组织请求参数
        const queryParams = nodesToRender.map((item) => item.id).join(',');
        const nodesMap = Object.fromEntries(nodesToRender.map((node) => [node.id, node]));

        // 获取图片URL
        const imageUrl = `https://api.figma.com/v1/images/${fileId}?ids=${queryParams}&scale=${scale}&format=${format}`;
        const response = await axios.get(imageUrl, { headers: { 'X-Figma-Token': accessToken } });

        // 保存图片到本地
        const imageMap = response.data.images;
        for (const [nodeId, imageUrl] of Object.entries(imageMap)) {
            if (imageUrl) {
                // 构造文件名并解析文件路径
                const fileName = `${nodesMap[nodeId].name}__${nodeId.split(':').join('-')}__${Date.now()}.${format}`;
                const filePath = path.resolve(imageSavePath, fileName);
                // 保存图片到文件
                await saveImageToFile(imageUrl, filePath);
                console.log(chalk.magenta(`节点 ${nodeId} 的图片已保存为 <${fileName}>`));
            } else {
                console.warn(chalk.bgRed(`节点 ${nodeId} 的图片渲染失败`));
            }
        }
        console.log(chalk.bgGreen('图片导出完成...'));
    } catch (error) {
        console.error('导出图片时出错: ', error);
    }
}

// 将图片保存到文件
async function saveImageToFile(imageUrl, filePath) {
    const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream'
    });

    // 使用Promise确保图片完全写入
    await new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filePath))
            .on('finish', resolve)
            .on('error', reject);
    });
}