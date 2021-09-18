const Discord = require("discord.js");

const { prefix, token, youtube_api_key } = require("./config.json");
const ytdl = require("ytdl-core");

var fs = require("fs");
const client = new Discord.Client();
var modules_embeds = require("./modules_embeds.js");
var modules_basic = require("./modules_basic.js");
var axios = require("axios");

async function getVideoLink(keyWord) {
  if (keyWord.match(/ht.*?\/\//g)) {
    return keyWord;
  } else {
    // const response = await axios.get(
    //   "https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=" +
    //     encodeURIComponent(keyWord) +
    //     "&type=video&key=AIzaSyBLptVtxSxpl3q6gTULHyKRPxy_TSInQFk"
    // );

    const response = await axios.get(
      `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        keyWord
      )}&type=video&key=${youtube_api_key}`
    );
    return (
      "https://www.youtube.com/watch?v=" + response.data.items[0].id.videoId
    );
  }
}

client.on("ready", () => {
  console.log("Ready!");
  client.user.setActivity("Bot Name", {
    type: "LISTENING",
  });
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

var musicList = [];
var queue = new Map();

client.on("message", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    if (message.content.split(prefix)[1].split(" ")[1] == undefined) {
      message.channel.send("คุณต้องป้อนคำสั่งที่ถูกต้อง!");
      return;
    }
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}musiclist`)) {
    message.channel.send(modules_embeds.embeds_music_list(musicList));
  } else {
    message.channel.send("คุณต้องป้อนคำสั่งที่ถูกต้อง!");
  }
});

async function execute(message, serverQueue) {
  let content = message.content.split(prefix)[1].split(" ")[1];
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send("คุณต้องอยู่ในช่องเสียงเพื่อเล่นเพลง!");
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "ฉันต้องการสิทธิ์ในการเข้าร่วมและพูดในช่องเสียงของคุณ!"
    );
  }

  var result2;
  let getVideoLink2 = getVideoLink(content);
  await getVideoLink2.then(function (result) {
    result2 = result;
  });

  const songInfo = await ytdl.getInfo(result2);

  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
    viewCount: modules_basic.nFormatter(songInfo.videoDetails.viewCount, 1),
    likes: modules_basic.nFormatter(songInfo.videoDetails.likes, 1),
    dislikes: modules_basic.nFormatter(songInfo.videoDetails.dislikes, 1),
    url_thumbnails:
      songInfo.videoDetails.thumbnails[
        songInfo.videoDetails.thumbnails.length - 1
      ].url,
    author: songInfo.videoDetails.author.name,
    uploadDate: songInfo.videoDetails.uploadDate,
    type: "",
    author_play: message.author.username,
    author_profile_url: message.author.avatarURL("webp", true, 64),
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);
    musicList.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    musicList.push(song);
    return message.channel.send(`**${song.title}** เพิ่มลงในคิวการเล่นแล้ว!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send("คุณต้องอยู่ในช่องเสียงเพื่อข้ามเพลง!");
  if (!serverQueue) return message.channel.send("ไม่มีเพลงให้ข้าม!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send("คุณต้องอยู่ในช่องเสียงเพื่อหยุดเพลง!");

  if (!serverQueue) return message.channel.send("ไม่มีเพลงให้หยุด!");

  serverQueue.songs = [];
  musicList = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    musicList.shift();
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);

    return;
  }
  if (musicList[1]) {
    musicList.shift();
  }

  const dispatcher = serverQueue.connection
    .play(
      ytdl(song.url, {
        filter: "audioonly",
      })
    )
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", (error) => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(
    modules_embeds.embeds_play_v2({
      song_Title: song.title,
      song_uploadDate: song.uploadDate,
      song_view_count: song.viewCount,
      song_likes: song.likes,
      song_disklike: song.dislikes,
      song_author: song.author,
      url_thumbnails: song.url_thumbnails,
    })
  );
}

client.login(token);
