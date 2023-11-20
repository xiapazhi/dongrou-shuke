const puppeteer = require('puppeteer');

(async () => {
    let url = 'http://training.zjkj.edufe.cn/auth/login'
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();
    await page.goto(url);

    let xpath = './/*[contains(@class,"Input_Input_")]';
    let element = await page.$x(xpath);
    console.log(element);
    if (element.length > 0) {
        // 找到输入框元素
        // 判断 type
        console.log("Element found!");
        console.log(element[0].type('123'));
    } else {
        console.log("Element not found.");
    }

    const classSelector = `Input_Input_[a-zA-Z0-9-_]+`; // 替换为你要匹配的类名模式  
    const selector = `[class~="${classSelector}"]`; // 使用属性选择器匹配类名  
    const loginElement = await page.querySelector(selector);
    console.log(loginElement);

    // 登录
    // await page.type('#username', 'admin');
    // await page.type('#password', '123456');
    // await page.click('#loginBtn');

    // 截突
    // await page.screenshot({ path: 'example.png' });
    // 关闭
    // await browser.close();
    setTimeout(async () => {
        await browser.close();
    }, 1000 * 10)
})()
