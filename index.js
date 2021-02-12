const { Buffer } = require('buffer');
const path = require('path');
const uwave = require('u-wave-core');
const createWebClient = require('u-wave-web/middleware').default;
const youTubeSource = require('u-wave-source-youtube');
const soundCloudSource = require('u-wave-source-soundcloud');
const dotenv = require('dotenv');
const announce = require('u-wave-announce');
const { EmoteFetcher } = require('@mkody/twitch-emoticons');

dotenv.config();

const configPath = './config';
const config = require(path.resolve(process.cwd(), configPath));

const port = process.env.PORT;
const secret = Buffer.from(process.env.SECRET, 'hex');

const fetcher = new EmoteFetcher();

const recaptcha = {
    secret: process.env.CAPTCHA_SECRET,
    key: process.env.CAPTCHA_KEY
};

const emailSettings = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
};

const uw = uwave({
    port,
    secret,
    recaptcha,
    redis: process.env.REDIS,
    mongo: process.env.MONGO
});

uw.on('mongoError', (err) => {
    throw console.error(err, 'Could not connect to MongoDB. Is it installed and running?');
});

uw.on('redisError', (err) => {
    throw console.error(err, 'Could not connect to the Redis server. Is it installed and running?');
});

uw.use(announce);

uw.use(async () => {
    uw.source(youTubeSource, {
        key: process.env.YOUTUBE_API_KEY,
        search: {
            videoSyndicated: 'any',
        }
    });
    uw.source(soundCloudSource, {
        key: process.env.SOUNDCLOUD_API_KEY
    });
});

uw.use(async () => {
    //Load Twitch Emotes
    Promise.all([
        fetcher.fetchTwitchEmotes(),
        fetcher.fetchBTTVEmotes(),

        fetcher.fetchTwitchEmotes(23161357), //Lirik
        fetcher.fetchTwitchEmotes(71092938), //xQcOW
        fetcher.fetchTwitchEmotes(22484632), //forsen
        fetcher.fetchTwitchEmotes(40972890), //AdmiralBahroo

        fetcher.fetchBTTVEmotes(23161357),
        fetcher.fetchBTTVEmotes(71092938),
        fetcher.fetchBTTVEmotes(22484632),
        fetcher.fetchBTTVEmotes(40972890),

        fetcher.fetchFFZEmotes(23161357),
        fetcher.fetchFFZEmotes(71092938),
        fetcher.fetchFFZEmotes(22484632),
        fetcher.fetchFFZEmotes(40972890)
    ]).then(() => {
        const fetchEmotes = Object.fromEntries(fetcher.emotes);
        const cleanEmotes = Object.fromEntries(
            Object.entries(fetchEmotes)
                .map(([key, val]) => [key, val.toLink()])
        );

        const webClient = createWebClient({
            apiBase: '/api',
            title: '♪ Electronic Dance Music ♪',
            recaptcha: recaptcha && { key: recaptcha.key },
            emoji: Object.assign(
                {},
                cleanEmotes
            )
        });

        uw.express.use(webClient);
    }).catch(err => {
        console.error('Failed Loading Emotes!');
        console.error(err);
    });
});

uw.listen().then(() => {
    console.log(`EDM Spot server running on https://edmspot.net:${port}/`);
}, (err) => {
    console.error(err.stack);
    process.exit(1);
});

process.on('beforeExit', () => {
    uw.close();
});
