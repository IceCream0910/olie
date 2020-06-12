let chart = 'realtime'
let interval;
let selectSong = []
let playlist = []
let nowPlayPos = 0;
let page = 1;
let searchKeyword = ''

const API_KEY = 'AIzaSyBvKYR4aIyX4XVFQmuWVCwedcMfpHbsoY4' // 유튜브 api 키
let apiPossible = false
let player

$(document).ready(function () {
    showLoading()
    getChart(chart)
})

$('.prev-page').click(function () {
    $('#chart-list').empty()
    $('#search-list').empty()
    $('.page-no').hide()
    emptySelectSong()

    showLoading()
    if (page > 1) {
        page--
        $('.now-page').text(page)
        getSearch(searchKeyword, page)
    }
})

$('.next-page').click(function () {
    $('#chart-list').empty()
    $('#search-list').empty()
    $('.page-no').hide()
    emptySelectSong()

    showLoading()
    page++
    $('.now-page').text(page)
    getSearch(searchKeyword, page)
})

$('.chart-btn').click(function (e) {
    $('.chart-btn').removeClass('select')
    $(this).addClass('select')
    $('#chart-list').empty()
    emptySelectSong()

    showLoading()
    getChart($(this).attr('data'))
})

$("#search-btn").click(function () {
    page = 1
    $('.page-no').hide()
    $('.now-page').text("1")
    $('#chart-list').empty()
    $('#search-list').empty()
    emptySelectSong()

    showLoading()
    getSearch($("#search-key").val(), page)
})

$(document).on('click', '.list-box', function () {
    if ($(this).hasClass('select')) {
        removeSelectSong(this)
    }
    else {
        addSelectSong(this)
    }
})

function addSelectSong(t) {
    $(t).addClass('select')

    if ($(t).hasClass('chart-box')) {
        selectSong.push({
            'name': $(t).find('.song-name').clone().children().remove().end().text(),
            'artist': $(t).find('.song-artist').text(),
            'album': $(t).find('.album-name').text(),
            'thumb': $(t).find('.album-thumb > img').attr('src')
        })
    }
    else {
        selectSong.push({
            'id': $(t).find('.album-no').text(),
            'name': $(t).find('.song-name').clone().children().remove().end().text(),
            'artist': $(t).find('.song-artist').text(),
            'album': $(t).find('.album-name').text(),
            'thumb': ""
        })
    }
    $("#select-box .select-msg").text("총 " + selectSong.length + "곡이 선택됐습니다")
    if (selectSong.length == 1) {
        $("#select-box").fadeIn()
    }
}

function getThumbById(albumNo) {
    $.ajax({
        url: "/getAlbumThumb/" + albumNo,
        type: 'GET',
        dataType: "html",
        success: function (data) {
            $('.list-btn').each(function (i, t) {
                if ($(t).find('.song-id').text() == albumNo && $(t).find('img').attr('src') == "/static/images/thumb-frame.png") {
                    $(t).find('img').attr('src', data)+"/melon/resize/120/quality/80/optimize"
                }
            })
        },
        error: function (data) {

        }
    });
}

function removeSelectSong(t) {
    $(t).removeClass('select')
    // selectSong.splice(selectSong.indexOf({
    //     'name' : $(t).find('.song-name').text(),
    //     'artist': $(t).find('.song-artist').text(),
    //     'thumb' : $(t).find('.album-thumb > img').attr('src')
    // }), 1)

    $.each(selectSong, function (i) {
        if (selectSong[i].name === $(t).closest('.list-box').find('.song-name').clone().children().remove().end().text() && selectSong[i].artist === $(t).find('.song-artist').text() && selectSong[i].album === $(t).find('.album-name').text()) {
            selectSong.splice(i, 1);
            return false;
        }
    });

    $("#select-box .select-msg").text("총 " + selectSong.length + "곡이 선택됐습니다")

    if (selectSong.length == 0) {
        $("#select-box").fadeOut()
    }
}

function emptySelectSong() {
    selectSong = []
    $(".list-box").removeClass('select')
    $("#select-box").fadeOut('fast')
}

function getChart(types) {
    $('.top').hide()
    $('.chart-top').show()
    $.ajax({
        url: "/getMelonChartView/" + types,
        type: 'GET',
        dataType: "html",
        success: function (data) {
            hideLoading()
            $('#chart-list').html($(data).html())
        },
        error: function (data) {
            $("#loading > h1").text("로딩에 실패했습니다. 다시 시도해주세요.")
            clearInterval(interval)
        }
    });
}

function getSearch(q, page) {
    searchKeyword = q
    $('.top').hide()
    $('.search-top').show()
    $.ajax({
        url: "/getSearchResultView?q=" + q + "&page=" + page,
        type: 'GET',
        dataType: "html",
        success: function (data) {
            hideLoading()
            $('#search-list').html($(data).html())
            if ($('.search-box').length == 0) {
                $("#loading > h1").text("검색결과 없음")
                $("#loading").css('display', 'flex');
                clearInterval(interval)
            }
            if (page == 1) {
                $('.prev-page').hide()
            }
            else {
                $('.prev-page').show()
            }
            $('.page-no').css('display', 'flex')
        },
        error: function (data) {
            $("#loading > h1").text("로딩에 실패했습니다. 다시 시도해주세요.")
            clearInterval(interval)
        }
    });
}

function showLoading() {
    $("#loading").css('display', 'flex');
    var count = 0;
    $("#loading > h1").text("Now Loading")
    interval = setInterval(function () {
        if (count > 2) {
            $("#loading > h1").text("Now Loading")
            count = 0;
        }
        else {
            $("#loading > h1").text($("#loading > h1").text() + ".")
            count++;
        }

    }, 1000)
}

function hideLoading() {
    $("#loading").css('display', 'none');
    clearInterval(interval)
}

$(document).on('click', '.song-play', function (e) {
    e.stopPropagation();
    initPlayList()

    if ($(this).closest('.list-box').hasClass('chart-box')) {
        addPlayList([{
            'name': $(this).closest('.list-box').find('.song-name').clone().children().remove().end().text(),
            'artist': $(this).closest('.list-box').find('.song-artist').text(),
            'thumb': $(this).closest('.list-box').find('.album-thumb > img').attr('src')
        }])

    }
    else {
        addPlayList([{
            'id': $(e.target).closest('.list-box').find('.album-no').text(),
            'name': $(e.target).closest('.list-box').find('.song-name').clone().children().remove().end().text(),
            'artist': $(e.target).closest('.list-box').find('.song-artist').text(),
            'thumb': ""
        }])
    }
    startPlayList()
})

$(document).on('click', '.song-plus', function (e) {
    e.stopPropagation();
    if ($(this).closest('.list-box').hasClass('chart-box')) {
        addPlayList([{
            'name': $(this).closest('.list-box').find('.song-name').clone().children().remove().end().text(),
            'artist': $(this).closest('.list-box').find('.song-artist').text(),
            'thumb': $(this).closest('.list-box').find('.album-thumb > img').attr('src')
        }])

    }
    else {
        addPlayList([{
            'id': $(e.target).closest('.list-box').find('.album-no').text(),
            'name': $(e.target).closest('.list-box').find('.song-name').clone().children().remove().end().text(),
            'artist': $(e.target).closest('.list-box').find('.song-artist').text(),
            'thumb': ""
        }])
    }
})

$(document).on('click', '.play-select', function (e) {
    e.stopPropagation();
    initPlayList()
    addPlayList(selectSong)
    startPlayList()
    emptySelectSong()
})

$(document).on('click', '.plus-select', function (e) {
    addPlayList(selectSong)
    emptySelectSong()
})

function initPlayList() {
    playlist = []
    nowPlayPos = 0;
    $('#playlist').empty()
}

function startPlayList() {
    setPlayIcon('pause')
    $("#playing-song").text(playlist[nowPlayPos].name)
    $("#playing-artist").text(playlist[nowPlayPos].artist)
    $("#playlist .list-btn").removeClass('select')
    $("#playlist .list-btn").eq(nowPlayPos).addClass('select')

    searchYoutube(playlist[nowPlayPos].artist + " " + playlist[nowPlayPos].name).then(function (str) {
        var list = JSON.parse(str)

        if (list.items[0] != undefined) {
            player.loadVideoById(list.items[0].id.videoId)
        }
    })
}

$(document).on('click', '.song-plus', function () {

})

function addPlayList(list) {
    for (var i = 0; i < list.length; i++) {
        playlist.push(list[i])

        var clone = $('.playlist-wrap .list-temp').clone().removeClass('list-temp').addClass('list-btn')
        $(clone).find('.song-name').text(list[i].name)
        $(clone).find('.song-artist').text(list[i].artist)
        if (list[i].thumb != "") {
            $(clone).find('img').attr('src', list[i].thumb)
        }

        if(list[i].id != undefined){
            $(clone).find('.song-id').text(list[i].id)
            getThumbById(list[i].id)
        }
        $(clone).appendTo('#playlist');
    }
}

function initYoutubeApi() {
    gapi.client.init({
        'apiKey': API_KEY
    }).then(function () {
        gapi.client.load('youtube', 'v3', function () {
            $("#loading-api").fadeOut()
        });
    })
}

function searchYoutube(q) {
    return new Promise(function (resolve, reject) {
        var request = gapi.client.youtube.search.list({
            q: q,
            part: 'id',
            type: 'video',
            videoEmbeddable: true,
            videoSyndicated: true
        });

        request.execute(function (response) {
            var str = JSON.stringify(response.result);
            resolve(str)
        });
    })
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('video-section', {
        height: '360',
        width: '640',
        playerVars: { 'autoplay': 1},
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.setVolume(50)
}

function onPlayerStateChange(event) {
    if (event.data === 0) {
        if (nowPlayPos < playlist.length - 1) {
            nowPlayPos++
            startPlayList()
        }
        else {
            setPlayIcon('play')
        }
    }
}

$(".song-controller").click(function () {
    switch (player.getPlayerState()) {
        case -1:
            togglePlayIcon()
            startPlayList()
            break
        case 0:
            if (nowPlayPos == playlist.length - 1 && $("#play-play").hasClass('select')) {
                nowPlayPos = 0;
                startPlayList()
            }
            break
        case 1:
            togglePlayIcon()
            player.pauseVideo()
            break
        case 2:
            togglePlayIcon()
            player.playVideo()
            break
        case 5:
            togglePlayIcon()
            startPlayList()
            break
    }
})

$("#prev-btn").click(function () {
    if (nowPlayPos > 0) {
        nowPlayPos--
    }
    startPlayList()
})

$("#next-btn").click(function () {
    if (nowPlayPos < playlist.length - 1) {
        nowPlayPos++
        startPlayList()
    }
})

function togglePlayIcon() {
    $("#play-play").toggleClass('select')
    $("#play-pause").toggleClass('select')
}

function setPlayIcon(state) {
    if (state == 'play') {
        $("#play-pause").removeClass('select')
        $("#play-play").addClass('select')
    }
    else if (state == 'pause') {
        $("#play-play").removeClass('select')
        $("#play-pause").addClass('select')
    }
}

$('#header .logo').click(function () {
    $('#chart-list').empty()
    $('#search-list').empty()
    $('.page-no').hide()
    emptySelectSong()
    showLoading()
    getChart(chart)
})

$('.play-all-chart').click(function () {
    initPlayList()
    $('.list-box').each(function (i, t) {
        if ($(t).hasClass('chart-box')) {
            addPlayList([{
                'name': $(t).find('.song-name').clone().children().remove().end().text(),
                'artist': $(t).find('.song-artist').text(),
                'thumb': $(t).find('.album-thumb > img').attr('src')
            }])

        }
        else {
            addPlayList([{
                'id': $(t).find('.album-no').text(),
                'name': $(t).find('.song-name').clone().children().remove().end().text(),
                'artist': $(t).find('.song-artist').text(),
                'thumb': ""
            }])
        }
    })
    startPlayList()
})

$('.plus-all-chart').click(function () {
    emptySelectSong()
    $('.list-box').each(function (i, t) {
        if ($(t).hasClass('chart-box')) {
            addPlayList([{
                'id': $(t).find('.album-no').text(),
                'name': $(t).find('.song-name').clone().children().remove().end().text(),
                'artist': $(t).find('.song-artist').text(),
                'thumb': $(t).find('.album-thumb > img').attr('src')
            }])

        }
        else {
            addPlayList([{
                'id': $(t).find('.album-no').text(),
                'name': $(t).find('.song-name').clone().children().remove().end().text(),
                'artist': $(t).find('.song-artist').text(),
                'thumb': ""
            }])
            
        }
    })
    addPlayList(selectSong)
    emptySelectSong()
})


// player.loadVideoById(id)
// playVideo();, pauseVideo(), stopVideo()
// player.getCurrentTime()
// player.getDuration()
// player.setVolume() 0~100
// player.setPlaybackQuality small
