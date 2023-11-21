const puppeteer = require('puppeteer');

(async () => {
    const domain = 'http://training.zjkj.edufe.cn';

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1280,
            height: 720,
        },
    });

    const loginurl = domain + '/auth/login'
    const page = await browser.newPage();
    await page._client.send("Runtime.enable");
    await page.goto(loginurl);

    let loginInputXpath = './/input[contains(@class,"Input_Input_")]';
    let loginInputElement = await page.$x(loginInputXpath);

    if (loginInputElement.length > 0) {
        // 找到输入框元素
        // 判断 type
        for await (let e of loginInputElement) {
            let eType = await e.handle.evaluate(element => {
                return element.type
            });
            if (eType === 'text') {
                // 用户名
                await e.type('150422199508175121');
            } else {
                // 密码
                await e.type('Jixujia3721');
            }
        }

        const loginBut = await page.$x('.//button[@type="submit"]');
        await loginBut[0].click();

        // 关闭弹窗
        const introSkipBtn = await page.waitForSelector('.introjs-skipbutton')
        await introSkipBtn.click();

        const yearPlanListRes = await page.waitForResponse(
            // domain + '/JXJY/zjkj/studentPlan/initPlan'
            async response => {
                if (response.url() !== domain + '/JXJY/zjkj/studentPlan/initPlan') return false
                return await response.text();
            }
        );
        if (yearPlanListRes?.ok()) {
            // // 取这个 planName 元素 保险一下
            // await page.waitForSelector('.planName')
            // // 找到所有年度列表
            // let yearListXpath = '//div[contains(@class,"PlanList_playlist_37J8ASEe")]';
            // let yearList = await page.$x(yearListXpath);
            // let yearListLen = yearList.length;

            const yearPlanList = (await yearPlanListRes.json()).data?.list || [];

            for (let p of yearPlanList) {
                console.log(p);
                if (p.planState == 2) {
                    // 已完成
                } else if (p.planState == 0) {
                    // 进行中
                    const goYearStudyUrl = domain + '/plan/courses/' + p.planId
                    console.log(`年度课程跳转 ${p.execYear} ${goYearStudyUrl}`);
                    await page.goto(goYearStudyUrl);

                    const studyPlanListRes = await page.waitForResponse(
                        async response => {
                            if (response.url() !== domain + '/JXJY/zjkj/studentPlan/studyPlan?planId=' + p.planId) return false
                            return await response.text();
                        }
                    );
                    if (studyPlanListRes?.ok()) {
                        const studyPlanList = (await studyPlanListRes.json()).data || [];
                        console.log(studyPlanList);
                    }
                } else if (p.planState == -1) {
                    // 未开始
                }
            }
        }







        setTimeout(async () => {

        }, 3000)

    } else {
        console.log("Element not found.");
    }

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
    },
        1000 *
        // 1
        // 10
        20
    )
})()
