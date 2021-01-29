const axios = require('axios');


check('http://www.google.com').then((result) => console.log(result.message)).catch((error) => { console.error(error) });


async function check(url, headers) {
    try {
        let time0 = Date.now();
        const response = await axios.get(url);
        let time1 = Date.now();
        let status = response.status;
        if ((status >= 200) && (status <= 299)) {
            return { message: `[OK] - http code: ${status}. Elapsed time: ${(time1 - time0)}ms.`, response: response };
        }
        if (status >= 400) {
            throw { message: `[Failed] - http code: ${status}. Elapsed time: ${(time1 - time0)}ms.`, response: response };
        }
    } catch (error) {
        console.error(error);
    }
};

module.exports.check = check;