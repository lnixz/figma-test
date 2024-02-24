#!/usr/bin/env node
import axios from 'axios';
import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();
program.version('1.0.0')
    .option('-u, --url <url>', 'figma file url')
    .option('-t, --accessToken <accessToken>', 'figma access token')
    .option('-p, --imageSavePath [imageSavePath]', 'figma file images save path', './figma/images')
    .option('-i, --ignoreNodeName [ignoreNodeName]', 'ignore node name')
    .option('-s, --scale [scale]', 'A number between 0.01 and 4, the image scaling factor', 2)
    .option('-f, --format [format]', 'A string enum for the image output format, can be jpg, png, svg, or pdf', 'png')
    .action((options) => {
        console.log('options:', options);
        if (!options.url) {
            console.error('url is required');
            process.exit(1);
        }
        if (!options.accessToken) {
            console.error('accessToken is required');
            process.exit(1);
        }
        const url = options.url;
        const { fileId, pageId } = getFileIdByURL(url);
        console.log('fileId: ' + fileId);
        console.log('pageId: ' + pageId);
        options['fileId'] = fileId;
        options['pageId'] = pageId;

        // 调用下载函数
        downloadFigmaInfo(options);
    })
    .parse(process.argv);

function getFileIdByURL(urlStr) {
    const url = new URL(urlStr);
    console.log('url: ', url);
    const pathname = url.pathname;
    const fileId = pathname.split('/file/')[1].split('/')[0];
    const pageId = url.searchParams.get('node-id').split('-').join(':');
    return { fileId, pageId };
}

async function downloadFigmaInfo(options) {
    const { fileId, pageId, accessToken, imageSavePath } = options;
    try {
        console.log(chalk.blue('开始下载文件信息...'));
        const response = await axios.get(`https://api.figma.com/v1/files/${fileId}`, {
            headers: {
                'X-Figma-Token': accessToken
            }
        });

        console.log(chalk.green('获取到Figma文件内容...'));

        const fileContent = response.data;
        console.log('fileContent: ', fileContent.document);

        const pages = fileContent.document.children.filter((item) => item.id === pageId);
        const nodesToRender = pages.map((item) => item.children.filter((item) => item.type === 'FRAME')).flat(2);
        console.log('nodesToRender: ', nodesToRender);

        console.log(chalk.yellow('检查目录是否存在，不存在则创建目录...'));
        fs.ensureDir(imageSavePath)
            .then(() => {
                console.log(chalk.green(`Dirctory ${imageSavePath} exists or has been created.`));
                // 在这里执行后续操作，如写入文件等
                exportImages(nodesToRender, options);
            })
            .catch((err) => {
                console.error(`Failed to create directory: ${err}`);
            })
    } catch (error) {
        console.error('Error fetching Figma file:', error);
    }
}


async function exportImages(nodesToRender, options) {
    if (!nodesToRender.length) {
        console.log(chalk.red('<nodesToRender> must be specified.'));
        process.exit(1);
    };
    const { fileId, accessToken, scale, imageSavePath, format } = options;
    try {
        console.log(chalk.blue('开始导出图片...'));

        // 组织请求参数
        const queryParams = nodesToRender.map((item) => item.id).join(',');
        console.log('queryParams: ', queryParams);
        const nodesMap = Object.fromEntries(nodesToRender.map((node) => [node.id, node]));
        console.log('nodesMap: ', nodesMap);

        // 发起 GET 请求
        const imageUrl = `https://api.figma.com/v1/images/${fileId}?ids=${queryParams}&scale=${scale}&format=${format}`;
        console.log(chalk.green('imageUrl: ', imageUrl));

        const response = await axios.get(imageUrl, {
            headers: {
                'X-Figma-Token': accessToken
            },
        });

        // 遍历返回的图片映射，保存每个图片到本地
        const imageMap = response.data.images;

        for (const [nodeId, imageUrl] of Object.entries(imageMap)) {
            if (imageUrl) {
                const fileName = `${nodesMap[nodeId].name}__${nodeId.split(':').join('-')}__${Date.now()}.${format}`;
                const filePath = path.resolve(imageSavePath, fileName);
                await saveImageToFile(imageUrl, filePath);
                console.log(chalk.magenta(`Node ${nodeId} image saved as <${fileName}>`));
            } else {
                console.warn(chalk.bgRed(`Failed to  render image for node ${nodeId}`));
            }
        }
        console.log(chalk.bgGreen('导出图片完成...'));
    } catch (error) {
        console.error('Error fetching images: ', error);
    }
}

async function saveImageToFile(imageUrl, filePath) {
    const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream'
    });

    await new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filePath))
            .on('finish', resolve)
            .on('error', reject)
    })
}