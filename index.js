
let wrapper = require('./anypoint-cli-api');

main();

async function main() {
    let apis = await wrapper.listApis("Test01");
    apis.forEach(api => {
        console.log(`Name: ${api['Exchange Asset Name']}  - InstanceId: ${api['Instance ID']}`);
    });

}


