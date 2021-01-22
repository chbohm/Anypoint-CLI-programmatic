
let proxyDefinitions = require('./proxy.definitions.json');
let proxyTemplate = proxyDefinitions.templates.proxy.__DEFAULT__;
let restProxyTemplate = Object.assign({}, proxyTemplate, proxyDefinitions.templates.proxy.rest);
let httpProxyTemplate = Object.assign({}, proxyTemplate, proxyDefinitions.templates.proxy.http);

log(getProxyDefinition('Test01', 'C1 Account API'));


function getProxyDefinition(envId, exchangeName) {
    let envDefinition = proxyDefinitions.environments[envId];
    let proxyDefinition = Object.assign({}, envDefinition.proxies[exchangeName]);
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


function log(json) {
    console.log(JSON.stringify(json, null, 2));
}
