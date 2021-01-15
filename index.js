
let cli = require('./anypoint-cli-api');

main();

async function main() {
    let apis = await cli.listApis("Test01");
    apis.forEach(api => {
        console.log(`Name: ${api['Exchange Asset Name']}  - InstanceId: ${api['Instance ID']}`);
    });
    apis = await cli.listApis("Dev");
    console.log(JSON.stringify(apis, null, 2));

}


