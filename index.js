import Deezer from 'deezer-playing-notifications';
import DiscordRPC from 'discord-rpc';
import fs from 'node:fs';

const config = JSON.parse(
    fs.readFileSync('./config.json')
    .toString()
);

const clientId = '1056711409817362452';
const rpc = new DiscordRPC.Client({
    transport: 'ipc'
});

const setActivity = async (
    track,
) => {
    const songName = track.title;
    const album = track.album.title;
    const albumArtUrl = track.album.cover_xl;
    const artist = track.artist.name;

    console.log(`Now playing "${songName}" by "${artist}" from the album "${album}"`);

    rpc.setActivity({
        details: songName < 2 ? `Playing ${songName}` : songName,
        state: `by ${artist}`,
        startTimestamp: Date.now(),
        endTimestamp: Date.now() + track.duration * 1000,
        largeImageKey: albumArtUrl,
        largeImageText: album.length < 2 ? `Album: ${album}` : album,
        instance: false,
    }).catch(console.error);
}

const xmpp = new Deezer(
    config['deezer user id'],
    config['deezer token']
).initializeXMPP();

const onTrackChanged = async trackId => {
    try {
        const song = await Deezer.getSong(trackId);

        setActivity(song);
    } catch (e) {
        console.error(e);
    }
}

xmpp.on('online', address => {
    console.log('Successfully connected to', address._domain)
});
xmpp.on('offline', () => {
    console.log('disconnected');
});
xmpp.on('error', err => {
    console.error(err.message);
});
xmpp.on('track', onTrackChanged);

xmpp.start();

rpc.login({
    clientId
}).then(() => {
    console.log('Connected to Discord successfully')
}).catch(console.error);