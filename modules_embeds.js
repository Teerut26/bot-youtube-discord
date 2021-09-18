const Discord = require("discord.js");

var d = new Date();
var n = d.toJSON();

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

exports.embeds_play_v2 = (obj) => {
  var embed = {
    title: obj.song_Title,
    color: 16711680,
    timestamp: n,
    footer: {
      icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png",
      text: obj.song_Title,
    },
    thumbnail: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png",
    },
    image: {
      url: obj.url_thumbnails,
    },
    fields: [{
        name: "UploadDate",
        value: obj.song_uploadDate,
        inline: false,
      },
      {
        name: "ViewCount",
        value: obj.song_view_count,
        inline: false,
      },
      {
        name: "Likes",
        value: obj.song_likes,
        inline: true,
      },
      {
        name: "Dislikes",
        value: obj.song_disklike,
        inline: true,
      },
      {
        name: "Author",
        value: obj.song_author,
        inline: false,
      },
    ],
  };
  return {
    embed,
  };
};

exports.embeds_music_list = (obj) => {
  var embed = {
    color: 4303841,
    timestamp: n,
    footer: {
      text: "Music List",
    },
    author: {
      name: "Music List",
    },
    fields: [],
  };
  for (let index = 0; index < obj.length; index++) {
    if (embed.fields.length == 0) {
      embed.fields.push({
        name: index + 1 + ". " + obj[index].title,
        value: obj[index].author_play + " / playing",
      });
    } else {
      embed.fields.push({
        name: index + 1 + ". " + obj[index].title,
        value: obj[index].author_play + " / next",
      });
    }
  }
  return {
    embed,
  };
};