const puppeteer = require('puppeteer');
// const puppeteer = require('puppeteer-extra')

const waitamount = async (time = 1000) => {
    await new Promise(resolve => setTimeout(() => resolve(), time));
}

(async () => {

    const STUDY_TG = 'STUDY';
    const ANSWER_TG = 'ANSWER';

    const TARGET = STUDY_TG

    const domain = 'http://training.zjkj.edufe.cn';

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1280,
            height: 720,
        },
        slowMo: 30, // slow down by 250ms
        // devtools: true,
        args: [`--window-size=1280,880`]
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

        await waitamount(100)
        const loginBut = await page.$x('.//button[@type="submit"]');
        // await loginBut[0].click();

        /** waitForResponse */
        // const yearPlanListRes = await page.waitForResponse(
        //     // domain + '/JXJY/zjkj/studentPlan/initPlan'
        //     async response => {
        //         // console.log(`GET RESPONSE: ${response.url()}`);
        //         if (response.url() !== domain + '/JXJY/zjkj/studentPlan/initPlan') {
        //             return false
        //         }
        //         return await response.text();
        //     }
        // );

        const [yearPlanListRes] = await Promise.all([
            page.waitForResponse(
                // domain + '/JXJY/zjkj/studentPlan/initPlan'
                async response => {
                    // console.log(`GET RESPONSE: ${response.url()}`);
                    if (response.url() !== domain + '/JXJY/zjkj/studentPlan/initPlan') {
                        return false
                    }
                    return await response.text();
                }
            ),
            loginBut[0].click()
        ])

        /** waitForRequest */
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

        // 循环学习小节课程
        const loopStudyCause = async ({
            classUrl,
            studyPlan,
        }) => {
            const [
                listenOnin,
                course,
                exercises
            ] = await Promise.all([
                page.waitForResponse(
                    // 获取当前听课信息
                    async response => {
                        if (
                            response.url().includes('getListenData')
                        ) {
                            return await response.text();
                        } else {
                            return false
                        }
                    }
                ),
                page.waitForResponse(
                    // 获取课程小节列表
                    async response => {
                        if (
                            response.url().includes('getCourseInfo')
                        ) {
                            return await response.text();
                        } else {
                            return false
                        }
                    }
                ),
                page.waitForResponse(
                    // 获取练习题目和答案
                    async response => {
                        if (
                            response.url().includes('getCasualExercises')
                        ) {
                            return await response.text();
                        } else {
                            return false
                        }
                    }
                ),
                classUrl ? page.goto(classUrl) : waitamount(0),
            ])

            const listenOninInfo = (await listenOnin.json()) || {};
            const courseInfo = (await course.json()) || {};
            const exercisesInfo = (await exercises.json()) || {};

            console.log(`开始学习课程 ${studyPlan.courseName}`);

            // const videoCover = await page.waitForSelector('.pv-icon-btn-play')

            // if (videoCover) {
            //     await videoCover.click()
            // }

            await waitamount()

            console.log(`播放 加速 * 2`);
            await page.evaluate(() => {
                const videoCover = document.querySelector('.pv-cover')
                console.log(videoCover.style.display);
                if (videoCover && videoCover.style.display == 'block') {
                    const videoPlayBut = document.querySelector('.pv-icon-btn-play')
                    videoPlayBut.click()
                }
                document.querySelector('.pv-video').playbackRate = 2;
            })

            const videoProcess = await page.waitForSelector('.pv-progress-current-bg')
            const checkProgress = async () => {
                const process = await videoProcess.handle.evaluate(element => {
                    return element.style.width
                })
                console.log(`进度 ${process}`);
                const processNumber = Number(process.replace('%', ''))
                if (processNumber < 100) {
                    await waitamount()
                    await checkProgress()
                } else {
                    console.log(`学习完成 ${studyPlan.courseName}`);
                }
            }
            await checkProgress()

            console.log(`学习完成 ${studyPlan.courseName}`);

            await waitamount()
            console.log(`随堂练习`);

            for (let exerciseType of exercisesInfo?.data?.questionTypes || []) {
                console.log(`开始练习 ${exerciseType.typeName}`);
                for (let question of exerciseType.questions || []) {
                    console.log(`${question.examinationContent}`);

                    if (question?.answers?.length) {

                        // 等待待选答案切换完成
                        await page.waitForXPath(`//li[contains(@class,"AsideExercise_RadioItem_")]/div[contains(text(),"${question?.answers[0].answerContent}")]`)

                        let hasAnswer = false
                        // 获取答案选择列
                        let exerciesRadio = await page.$x('//li[contains(@class,"AsideExercise_RadioItem_")]');
                        for (let answer of question?.answers || []) {
                            // 遍历答案选择列
                            if (answer.isRight) {
                                console.log(`正确答案： ${answer.answerContent}`);

                                for await (let radio of exerciesRadio) {
                                    let radioContent = await radio.handle.evaluate(element => {
                                        return element?.children[0]?.innerText
                                    });
                                    if (radioContent == answer.answerContent) {
                                        await radio.click()
                                        hasAnswer = true

                                        await waitamount(500)
                                        break
                                    }
                                }
                            }
                        }

                        if (hasAnswer) {
                            // 检测 下一题 按钮
                            let nextQueBut = await page.$x('//div[contains(@class,"AsideExercise_root_")]/button[contains(text(),"下一题")]');

                            if (nextQueBut?.length) {
                                nextQueBut[0].click()
                            } else {
                                // 检测 完成 按钮
                                let finishBut = await page.$x('//div[contains(@class,"AsideExercise_root_")]/button[contains(text(),"提交")]');
                                if (finishBut?.length) {
                                    finishBut[0].click()
                                } else {
                                    console.error(`下一步 迷茫`);
                                }
                            }

                            await waitamount(1000)
                            let a = 1
                        }
                    }

                }


            }
            console.log(`答题完毕`);

            // 课程小结之间 要把提示点掉
            // 等待弹框出现
            const gotBut = await page.waitForXPath(`//div[contains(@class,"Alert_root_")]/button[contains(text(),"知道了")]`)

            // 检查有没有下一小节要学


            if (gotBut) {
                gotBut.click()
            }
        }

        if (yearPlanListRes?.ok()) {
            // // 取这个 planName 元素 保险一下
            // await page.waitForSelector('.planName')
            // // 找到所有年度列表
            // let yearListXpath = '//div[contains(@class,"PlanList_playlist_37J8ASEe")]';
            // let yearList = await page.$x(yearListXpath);
            // let yearListLen = yearList.length;

            const yearPlanList = (await yearPlanListRes.json()).data?.list || [];

            let breakTemp = false
            for (let yearPlan of yearPlanList) {
                console.log(`遍历年度课程 ${yearPlan.execYear} 状态 ${yearPlan.planState}`);
                if (yearPlan.planState == 2) {
                    // 已完成
                } else if (yearPlan.planState == 0) {
                    await waitamount()
                    // 进行中
                    const goYearStudyUrl = domain + '/plan/courses/' + yearPlan.planId
                    console.log(`年度课程跳转 ${yearPlan.execYear} ${goYearStudyUrl}`);

                    // await page.goto(goYearStudyUrl);
                    // const studyPlanListRes = await page.waitForResponse(
                    //     async response => {
                    //         console.log(`年度课程 GET RESPONSE: ${response.url()}`);
                    //         if (response.url() !== domain + '/JXJY/zjkj/studentPlan/studyPlan?planId=' + yearPlan.planId) return false
                    //         return await response.text();
                    //     }
                    // );

                    let [studyPlanListRes] = await Promise.all([
                        page.waitForResponse(
                            async response => {
                                // console.log(`年度课程 GET RESPONSE: ${response.url()}`);
                                if (response.url() !== domain + '/JXJY/zjkj/studentPlan/studyPlan?planId=' + yearPlan.planId) return false
                                return await response.text();
                            }
                        ),
                        page.goto(goYearStudyUrl),
                    ])
                    console.log(studyPlanListRes);

                    // await waitamount()
                    if (studyPlanListRes?.ok()) {
                        const studyPlanList = (await studyPlanListRes.json()).data || [];
                        for (let studyPlan of studyPlanList?.courseList || []) {
                            console.log(`检查课程 ${studyPlan.courseName} 状态 ${studyPlan?.studyState}`);
                            if (studyPlan?.studyState == 2) {
                                // 已完成
                            } else if (studyPlan?.studyState == 1 || studyPlan?.studyState == 0) {
                                // 进行中 || 未开始
                                const classUrl = domain + '/course/video/' + yearPlan.planId + '/' + studyPlanList.studentPlanId + '/' + studyPlan.courseId + '/0'
                                console.log(`课程学习跳转 ${studyPlan.courseName}`);

                                // await page.goto(classUrl);

                                await loopStudyCause({
                                    classUrl,
                                    studyPlan,
                                })

                                await waitamount(300)

                                breakTemp = true
                            }

                            if (breakTemp) break
                        }


                        // throw 'xxx'
                    }


                } else if (p.planState == -1) {
                    await waitamount()
                    // 未开始
                }

                if (breakTemp) break
            }
        }

        await waitamount(20 * 1000)
        await browser.close();
    } else {
        console.log("Element not found.");
    }

    // 截图
    // await page.screenshot({ path: 'example.png' });
    // 关闭
    // await browser.close();
})()
