from flask import Flask, request, render_template
import requests
from bs4 import BeautifulSoup
import datetime, json
import traceback

app = Flask(__name__, template_folder="template")

lastTime = {}  #rise, month, week, day
lastChart = {} #rise, month, week, day

sampleTypes = ['realtime', 'rise', 'month', 'week', 'day']

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/getMelonChart/<types>')
def getMelonChart(types=None):
    # types = {realtime, rise, month, week, day}

    if types in sampleTypes:
        if types not in lastChart or datetime.datetime.now() >= lastTime[types] + datetime.timedelta(hours=1) :  # 한시간이 지났을 경우 or 처음 요청일경우
            print("갱신")
            lastTime[types] = datetime.datetime.now().replace(minute=0, second=0, microsecond=0)

            if types == 'realtime':
                url = 'https://www.melon.com/chart/index.htm'
            else:
                url = "https://www.melon.com/chart/"+types+"/index.htm"

            header = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'}
            html = requests.get(url, headers=header).text
            soup = BeautifulSoup(html, 'html.parser')
            tag_list = []
            for tr_tag in soup.find(id='tb_list').find_all('tr'): 
                # 올바른 요소만 추가
                if tr_tag.find(class_="ellipsis rank01") is not None:
                    add = {
                        "rank" : tr_tag.find(class_='rank').text,
                        "artist" : tr_tag.find(class_='ellipsis rank02').find('span').text,
                        "album" : tr_tag.find(class_='ellipsis rank03').find('a').text,
                        "img" : tr_tag.find(class_='image_typeAll').find('img')['src'].split('jpg')[0]+'jpg'
                    }

                    if tr_tag.find(class_='ellipsis rank01').find('.disabled') is not None:
                        add["title"] = tr_tag.find(class_='ellipsis rank01').find('a').text
                    else:
                        add["title"] = tr_tag.find(class_='ellipsis rank01').find('span').text

                    tag_list.append(add)

            lastChart[types] = tag_list
            return json.dumps(tag_list)
        else: # 이미 있는 자료일때
            return json.dumps(lastChart[types])
    else:
        return 'invaild request'
                
@app.route('/getMelonChartView/<types>')
def getMelonChartView(types=None):
    if types in sampleTypes:
        return render_template('chart.html', chart=json.loads(getMelonChart(types)))
    else:
        return 'invaild request'


@app.route('/getSearchResult')
def getSearchResult(param_q=None, param_page=None):
    keyword = request.args.get('q')
    page = request.args.get('page')

    if param_q is not None:
        keyword = param_q
    if param_page is not None:
        page = param_page

    if keyword is not None:
        url = "https://www.melon.com/search/song/index.htm?q=" + keyword

        if page is not None and int(page) > 1:
            url +="&pageSize=50&sort=weight&section=all&sectionId=&genreDir=&startIndex="+str((int(page)-1)*50+1)

        header = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'}
        html = requests.get(url, headers=header).text
        soup = BeautifulSoup(html, 'html.parser')
        song_list = []
                
        # 검색결과 존재시
        if soup.find(class_='section_no_data line') is None:
            for tr_tag in soup.find(id='frm_defaultList').find("tbody").find_all('tr'): 
                try:
                    add = {
                        "no" : tr_tag.find(class_='no').find(class_='wrap').text,
                        "title" : tr_tag.find_all('td')[2].find(class_='fc_gray').text,
                        "album_no" : tr_tag.find_all('td')[2].find(class_='fc_gray')['href'].replace("'", "").replace(');', '').split(',')[-1],
                        "album" : tr_tag.find_all('td')[4].find('a').text,
                        "is_title" : 'false',
                        "is_hot" : 'false'
                    }

                    artist = tr_tag.find(id='artistName').text
                    add['artist'] = artist[:int(len(artist)/2)]

                    if tr_tag.find(class_ = "title"):
                        add['is_title'] = 'true'

                    if tr_tag.find(class_ = "hot"):
                        add['is_hot'] = 'true'

                    song_list.append(add)
                except:
                    traceback.print_exc()

        return json.dumps(song_list)
    return 'invaild'

@app.route('/getSearchResultView')
def getSearchResultView():
    keyword = request.args.get('q')
    page = request.args.get('page')

    if keyword is not None:
        return render_template('search.html', search=json.loads(getSearchResult(keyword, page)))
    else:
        return 'invaild request'

@app.route('/getAlbumThumb/<albumId>')
def getAlbumThumb(albumId=None):
    if albumId is not None:
            url = 'https://www.melon.com/delivery/streamingInfo.json?contsId='+albumId+'&contsType=SONG&bitrate=320&pocId=WP10&stRight=N'
            print(url)

            header = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'}
            html = requests.get(url, headers=header).text
            soup = BeautifulSoup(html, 'html.parser')
            content = json.loads(str(soup))
            
            return 'https://cdnimg.melon.co.kr/'+content['streamingInfo']['imgPath']
    else:
        return 'invaild request'


if __name__ == '__main__':
    app.run()