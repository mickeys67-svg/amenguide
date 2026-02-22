const axios = require('axios');
const { convert } = require('html-to-text');

async function extractLink() {
    const url = 'http://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=mice';
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        // GoodNews uses EUC-KR often, but let's see
        const html = res.data.toString('utf-8');

        const links = html.match(/bbs_view\.asp\?seq=[0-9]+/g);
        if (links && links.length > 0) {
            console.log('FOUND LINK:', 'http://bbs.catholic.or.kr/bbs/' + links[0]);
        } else {
            console.log('NO LINKS FOUND');
        }
    } catch (e) {
        console.error(e.message);
    }
}

extractLink();
