
let proxyDefinitions = require('./proxy.definitions.json');
let proxyTemplate = proxyDefinitions.templates.proxy.base;
let restProxyTemplate = Object.assign({}, proxyTemplate, proxyDefinitions.templates.proxy.rest);
let httpProxyTemplate = Object.assign({}, proxyTemplate, proxyDefinitions.templates.proxy.http);

log(getProxyDefinition('Test02', 'C1 Account API'));


function getProxyDefinition(envId, exchangeName) {
    let envDefinition = get(proxyDefinitions.environments[envId],`proxyDefinitions.environments does not contain '${envId}'`);
    let proxyBasicDefinition = get(proxyDefinitions.proxies[exchangeName], `There is no such a proxy named as '${exchangeName}' in proxyDefinitions.proxies`);
    let proxyDefinitionInEnv = get(envDefinition.proxies[exchangeName], `The environment '${envId}' does not contain the proxy '${exchangeName}'`);
    let proxyDefinition = Object.assign({}, proxyBasicDefinition, proxyDefinitionInEnv);
    proxyDefinition.environment = Object.assign({}, envDefinition.config);
    switch (proxyDefinition.type) {
        case "rest": proxyDefinition = Object.assign(proxyDefinition, restProxyTemplate);
            if (!proxyDefinition.implementationUri) {
                proxyDefinition.implementationUri = `http://${proxyDefinition.environment.restServiceHost}:${proxyDefinition.port}`
            }
            break;
        case "http": proxyDefinition = Object.assign(proxyDefinition, httpProxyTemplate);
            if (!proxyDefinition.implementationUri) {
                proxyDefinition.implementationUri = `http://${proxyDefinition.environment.httpServiceHost}`
            }
            break;
        default: throw new Error("unknown proxy type: " + type);
    }


    return proxyDefinition;
}

function get(obj,errorMessage) {
    if (!obj) {
        throw new Error(errorMessage);
    }
    return obj;
}

function log(json) {
    console.log(JSON.stringify(json, null, 2));
}
