const { exec } = require('child_process');
const credentials = require('./credentials.json');
let token;
let envs = {
    'Dev': {
        'target': 3888174
    },
    'Test01': {
        'target': 2311411
    },
    'Test02': {
        'target': 2190934
    },
    'Test03': {
        'target': 2190937
    },
    'Test04': {
        'target': 2190941
    },
    'Test05': {
        'target': 2190942
    },
    'Test06': {
        'id': 'c694f7e1-9138-4376-9660-6f43dc1524d0',
        'jwtUrl': 'LVATHT06AP',
        'target': 2190943
    },
    'Test09': {
        'target': 2190951
    }

}

module.exports.envs = envs;




async function login(username, password) {
    return new Promise((resolve, reject) => {
        let defaults = {
            timeout: 60000,
            baseUrl: 'https://anypoint.mulesoft.com',
            strictSSL: false,
            json: true
        }
        let request = require('request-promise');
        requester = request.defaults(defaults);

        let options = {
            headers: {
                'User-Agent': 'Anypoint-CLI/3.4.3'
            },
            url: '/accounts/login',
            body: {
                username: username,
                password: password
            }
        };

        requester.post(options).then((body) => {
            resolve(body.access_token);
        }).catch((error) => { reject(error) })
    });


}
module.exports.login = login;

async function run(env, command) {
    if (!token) {
        token = await login(credentials.username, credentials.password);
    }
    return new Promise((resolve, reject) => {
        let lastData;
        let child = exec(`node node_modules/anypoint-cli/src/app.js --organization ${credentials.organization} --environment ${env} --bearer=${token} ${command}`, (error, stdout, stderr) => {
            if (error) {
                return reject(error.message);
            }
            try {
                resolve(JSON.parse(lastData))
            } catch (error) {
                resolve(lastData)
            };
        });

        child.stdout.on('data', function (data) {
            lastData = data;
        });
    }).catch((error) => {
        console.log('ERRRRORRRR ' + error);
    })


}

async function listApis(env) {
    return await run(env, 'api-mgr api list --limit 1000 -o json');
}
module.exports.listApis = listApis;

async function getApiDetail(env, apiInstanceId) {
    let result = await run(env, `api-mgr api describe -o json ${apiInstanceId}`);
    return JSON.parse(result);

}
module.exports.getApiDetail = getApiDetail;

//https://docs.mulesoft.com/runtime-manager/anypoint-platform-cli-commands#api-mgr-api-deploy
async function deployApi(apiInstanceId) {
    let result = await run(`api-mgr api deploy -o json --target ${envs[env].target} ${apiInstanceId}`);
    return JSON.parse(result);
}
module.exports.deployApi = deployApi;

async function redeploy(env, apiInstanceId) {
    let result = await run(`api-mgr api redeploy -o json --target ${envs[env].target} ${apiInstanceId}`);
    return JSON.parse(result);
}
module.exports.redeploy = redeploy;

//https://docs.mulesoft.com/runtime-manager/anypoint-platform-cli-commands#api-mgr-api-deploy
async function editApiUri(apiInstanceId, uri) {
    let result = await run(`api-mgr api edit -o json --uri ${uri} ${apiInstanceId}`);
    return JSON.parse(result);
}

async function editApiPath(apiInstanceId, path) {
    let result = await run(`api-mgr api edit -o json --path ${path} ${apiInstanceId}`);
    return JSON.parse(result);
}

async function listPolicies(apiInstanceId) {
    let result = await run(`api-mgr policy list -o json --muleVersion4OrAbove true ${apiInstanceId}`);
    return JSON.parse(result);
}

async function changeSpecification(env, apiInstanceId, assetVersion) {
    let result = await run(env, `api-mgr api change-specification -o json ${apiInstanceId} ${assetVersion}`);
    console.log(result);
}
module.exports.changeSpecification = changeSpecification;


function getJwtPolicy(env) {
    return {
        "policyId": null,
        "policyTemplateId": "299253",
        "groupId": "68ef9520-24e9-4cf2-b2f5-620025690913",
        "assetId": "jwt-validation",
        "assetVersion": "1.1.3",
        "order": 1,
        "pointcutData": [
           {
              "methodRegex": "GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD|TRACE|CONNECT",
              "uriTemplateRegex": "^((?!/api/v1/health).)*$"
           }
        ],
        "type": "system",
        "version": 1578421869332,
        "configurationData": 
        {
           "jwtOrigin": "httpBearerAuthenticationHeader",
           "jwtExpression": "#[attributes.headers['jwt']]",
           "signingMethod": "rsa",
           "signingKeyLength": 256,
           "jwtKeyOrigin": "jwks",
           "textKey": "your-(256|384|512)-bit-secret",
           "jwksUrl": `https://${envs[env].jwtUrl}/oauth/.well-known/openid-configuration/jwks`,
           "jwksServiceTimeToLive": 60,
           "skipClientIdValidation": true,
           "clientIdExpression": "#[vars.claimSet.client_id]",
           "validateAudClaim": false,
           "mandatoryAudClaim": false,
           "supportedAudiences": "aud.example.com",
           "mandatoryExpClaim": false,
           "mandatoryNbfClaim": false,
           "validateCustomClaim": false
        }
     }
}

async function applyJwtPolicy(env, instanceId) {
    if (!token) {
        token = await login(credentials.username, credentials.password);
    }

    return new Promise((resolve, reject) => {
        let defaults = {
            timeout: 60000,
            baseUrl: 'https://anypoint.mulesoft.com',
            strictSSL: false,
            json: true
        }
        let request = require('request-promise');
        requester = request.defaults(defaults);
        let options = {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            url: `/apimanager/api/v1/organizations/35948028-ba40-4ccc-bf9d-7a25bc819004/environments/${envs[env].id}/apis/${instanceId}/policies`,
            body: getJwtPolicy(env)
        };

        requester.post(options).then((body) => {
            resolve(body);
        }).catch((error) => { reject(error) })
    });
}
module.exports.applyJwtPolicy = applyJwtPolicy;




