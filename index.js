const { Buffer } = require('buffer');
const uwave = require('u-wave-core');
const createWebClient = require('u-wave-web/middleware').default;
const youTubeSource = require('u-wave-source-youtube');
const soundCloudSource = require('u-wave-source-soundcloud');
const dotenv = require('dotenv');
const announce = require('u-wave-announce');
const { EmoteFetcher } = require('@mkody/twitch-emoticons');

dotenv.config();

const port = process.env.PORT;
const secret = Buffer.from(process.env.SECRET, 'hex');

const fetcher = new EmoteFetcher();
const channels = [
    { "id": "23161357" },
    { "id": "71092938" }
];

const uw = uwave({
    port,
    secret,
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

        channels.forEach(async function (channel, index) {
            try {
                fetcher.fetchTwitchEmotes(channel.id);
            }
            catch {
                console.error('Failed Loading Twitch Emotes!');
            }
        }),

        channels.forEach(async function (channel, index) {
            try {
                fetcher.fetchBTTVEmotes(channel.id);
            }
            catch {
                console.error('Failed Loading BTTV Emotes!');
            }
        }),

        channels.forEach(async function (channel, index) {
            try {
                //fetcher.fetchFFZEmotes(channel.id);
            }
            catch {
                console.error('Failed Loading FFZ Emotes!');
            }
        })
    ]).then(() => {
        const fetchEmotes = Object.fromEntries(fetcher.emotes);
        const cleanEmotes = Object.fromEntries(
            Object.entries(fetchEmotes)
                .map(([key, val]) => [key, val.toLink()])
        );

        const webClient = createWebClient('/', {
            apiBase: '/api',
            title: '♪ Electronic Dance Music ♪',
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
