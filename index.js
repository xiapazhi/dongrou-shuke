const puppeteer = require('puppeteer');

const waitamount = async (time = 1000) => {
    await new Promise(resolve => setTimeout(() => resolve(), time));
}

(async () => {

    const STUDY_TG = 'STUDY';
    const ANSWER_TG = 'ANSWER';

    const TARGET = ANSWER_TG

    const domain = 'http://training.zjkj.edufe.cn';

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1280,
            height: 720,
        },
        slowMo: 50, // slow down by 250ms
        // devtools: true,
        args: [`--window-size=1280,920`]
    });
    browser.on('close', () => {
        // 在这里可以执行其他操作，例如保存日志或清理资源。  
        throw new Error('浏览器已关闭');
    });


    const loginurl = domain + '/auth/login'
    // const page = await browser.newPage();
    const [page] = await browser.pages();
    // await page.setViewport({ width: 1280, height: 720 });
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto(
        loginurl, {
        // waitUntil: "domcontentloaded"
    });

    await waitamount()
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

        await waitamount()
        const loginBut = await page.$x('.//button[@type="submit"]');
        await loginBut[0].click();

        if (TARGET === ANSWER_TG) {
            // 获取答案
            const cookies = await page.cookies();
            console.log(cookies);
            await browser.close();
        } else {
            const yearPlanListRes = await page.waitForResponse(
                // domain + '/JXJY/zjkj/studentPlan/initPlan'
                async response => {
                    console.log(`GET RESPONSE: ${response.url()}`);
                    if (response.url() !== domain + '/JXJY/zjkj/studentPlan/initPlan') {
                        return false
                    }
                    return await response.text();
                }
            );

            // const finalRequest = await page.waitForRequest(
            //     request => {
            //         console.log(`GET REQUEST: ${request.url()}`);
            //         if (request.url() !== domain + '/JXJY/zjkj/studentPlan/initPlan') {
            //             return false
            //         }
            //         // console.log(request.response());
            //         return true
            //     }
            // );

            // 关闭弹窗
            const introSkipBtn = await page.waitForSelector('.introjs-skipbutton')
            await introSkipBtn.click();

            if (yearPlanListRes?.ok()) {
                // // 取这个 planName 元素 保险一下
                // await page.waitForSelector('.planName')
                // // 找到所有年度列表
                // let yearListXpath = '//div[contains(@class,"PlanList_playlist_37J8ASEe")]';
                // let yearList = await page.$x(yearListXpath);
                // let yearListLen = yearList.length;

                const yearPlanList = (await yearPlanListRes.json()).data?.list || [];

                for (let yearPlan of yearPlanList) {
                    console.log(`遍历年度课程 ${yearPlan.execYear} 状态 ${yearPlan.planState}`);
                    if (yearPlan.planState == 2) {
                        // 已完成
                    } else if (yearPlan.planState == 0) {
                        await waitamount()
                        // 进行中
                        const goYearStudyUrl = domain + '/plan/courses/' + yearPlan.planId
                        console.log(`年度课程跳转 ${yearPlan.execYear} ${goYearStudyUrl}`);
                        await page.goto(goYearStudyUrl);

                        const studyPlanListRes = await page.waitForResponse(
                            async response => {
                                if (response.url() !== domain + '/JXJY/zjkj/studentPlan/studyPlan?planId=' + yearPlan.planId) return false
                                return await response.text();
                            }
                        );

                        await waitamount()
                        if (studyPlanListRes?.ok()) {
                            const studyPlanList = (await studyPlanListRes.json()).data || [];
                            for (let studyPlan of studyPlanList?.courseList || []) {
                                console.log(`遍历课程 ${studyPlan.courseName} 状态 ${d?.studyState}`);
                                if (studyPlan?.studyState == 2) {
                                    // 已完成
                                } else if (studyPlan?.studyState == 1 || studyPlan?.studyState == 0) {
                                    // 进行中 || 未开始
                                    const classUrl = domain + '/course/video/' + p.planId + '/' + studyPlanList.studentPlanId + '/' + studyPlan.courseId
                                    console.log(`课程学习跳转 ${studyPlan.courseName}`);

                                    await page.goto(goYearStudyUrl);
                                }
                            }
                            throw 'xxx'
                        }


                    } else if (p.planState == -1) {
                        await waitamount()
                        // 未开始
                    }
                }
            }

        }





        await browser.close();
    } else {
        console.log("Element not found.");
    }

    // 截图
    // await page.screenshot({ path: 'example.png' });
    // 关闭
    // await browser.close();
})()
