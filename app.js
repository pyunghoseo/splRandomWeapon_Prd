const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

let discordOutput = {
    current: {
        rule: '',
        players: [],
        spectators: [],
        time: ''
    },
    next: {
        rule: '',
        players: [],
        spectators: [],
        time: ''
    }
};

// 최초 공지 내용을 읽어옵니다.
let notice = [];
fs.readFile(path.join(__dirname, 'noti.txt'), 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading noti.txt:', err);
    } else {
        notice = data.split('\n').map(line => line.trim()).filter(line => line !== '');
    }
});

function parseInput(input) {
    const lines = input.split('\n');
    const rule = lines[0].split(':')[1].trim();
    const players = [];
    let spectators = [];
    let time = '';

    lines.slice(1).forEach(line => {
        if (line.startsWith('프로그램 실행시각')) {
            time = line.split(':')[1].trim();
        } else if (line.startsWith('관전 당첨')) {
            spectators = line.split(':')[1].trim().split(',').map(s => s.trim());
        } else {
            const match = line.match(/(\d+번) : (.+?) : (.+)/);
            if (match) {
                players.push(`${match[2]} : ${match[3]}`);
            }
        }
    });

    return { rule, players, spectators, time };
}

app.get('/', (req, res) => {
    res.render('index', { output: discordOutput, notice: notice });
});

app.get('/admin', (req, res) => {
    res.render('admin');
});

app.post('/admin', (req, res) => {
    const input = req.body.inputText;
    const newOutput = parseInput(input);

    // 기존 next 데이터를 current로 이동
    discordOutput.current = discordOutput.next;
    // 새로운 데이터를 next로 할당
    discordOutput.next = newOutput;

    res.redirect('/');
});

app.post('/update-notice', (req, res) => {
    const newNotice = req.body.noticeText;
    notice = newNotice.split('\n').map(line => line.trim()).filter(line => line !== '');

    // 공지사항을 파일에 저장
    fs.writeFile(path.join(__dirname, 'noti.txt'), newNotice, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to noti.txt:', err);
        }
    });

    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
