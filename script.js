// ⭐⭐ 이 부분을 1단계 C에서 복사한 '웹 앱 URL'로 교체해야 합니다! ⭐⭐
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4ILErkRe4zV4-KwY4my__2yTCigXkTegJ1giSeWtpXYpZLsn56PhGfK7-9Yy4tVDh/exec'; 

const submitBtn = document.getElementById('submitBtn');
const emotionLog = document.getElementById('emotionLog');
const thermometerFill = document.getElementById('thermometerFill');
const statusText = document.getElementById('statusText');
const missionText = document.getElementById('missionText');
const inputButtons = document.querySelectorAll('.thermometer-input button');

let selectedLevel = 0;

// 1. 감정 단계 선택 시 시각적 효과 부여
inputButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        inputButtons.forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedLevel = parseInt(e.target.dataset.level);
    });
});

// 2. 데이터 제출 및 Apps Script로 전송 (POST 요청)
submitBtn.addEventListener('click', async () => {
    const name = document.getElementById('studentName').value;
    const keywords = document.getElementById('keywords').value;
    
    if (selectedLevel === 0) {
        document.getElementById('message').textContent = '감정 온도를 선택해 주세요!';
        return;
    }

    const dataToSend = new URLSearchParams();
    dataToSend.append('name', name);
    dataToSend.append('level', selectedLevel);
    dataToSend.append('keywords', keywords);

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: dataToSend,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.ok) {
            document.getElementById('message').textContent = `✅ ${name || '익명'}님의 감정이 기록되었습니다!`;
            // 제출 성공 후 전체 데이터 다시 불러와서 화면 업데이트
            fetchAndDisplayData(); 
        } else {
            document.getElementById('message').textContent = '❌ 데이터 기록 실패: 서버 응답 오류';
        }
    } catch (error) {
        document.getElementById('message').textContent = '❌ 데이터 전송 오류: 네트워크 문제 확인';
        console.error('Fetch Error:', error);
    }
    
    // 입력창 초기화
    selectedLevel = 0; 
    document.getElementById('keywords').value = ''; 
    inputButtons.forEach(btn => btn.classList.remove('selected'));
});

// 3. 전체 데이터 불러오기 (GET 요청)
async function fetchAndDisplayData() {
    try {
        // Apps Script의 doGet 함수 호출 (action=getAllData 명령 전달)
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getAllData`); 
        const allData = await response.json(); 
        
        updateDisplay(allData); 
    } catch (error) {
        console.error('데이터 로딩 오류:', error);
        statusText.textContent = '데이터를 불러오는 데 문제가 발생했습니다.';
    }
}

// 4. 온도계 및 상태 업데이트 (공동체 의식 로직)
function updateDisplay(data) {
    if (data.length === 0) {
        statusText.textContent = '아직 기록된 학생 데이터가 없습니다.';
        thermometerFill.style.height = '0%';
        emotionLog.innerHTML = '';
        missionText.textContent = '지금 바로 첫 기록을 남겨보세요!';
        return;
    }

    const totalLevel = data.reduce((sum, entry) => sum + entry.level, 0);
    const averageLevel = totalLevel / data.length;
    
    // 온도계 높이 계산 (1-5 레벨을 0-100% 높이로 매핑)
    const fillPercentage = ((averageLevel - 1) / 4) * 100;
    thermometerFill.style.height = `${fillPercentage}%`;
    
    // 공동체 상태 및 미션 제시
    let statusMsg = `총 ${data.length}명 참여. 평균 감정 온도: ${averageLevel.toFixed(1)}점.`;
    let missionMsg = '';

    if (averageLevel <= 2.5) {
        statusMsg += ' 😊 공동체의 온도가 매우 평온합니다.';
        missionMsg = '✨ 미션: 가장 친하지 않은 친구에게 칭찬 한 마디 건네기.';
    } else if (averageLevel <= 3.5) {
        statusMsg += ' 🟡 공동체의 온도가 보통 수준입니다.';
        missionMsg = '🤝 미션: 오늘 가장 많이 웃은 친구를 찾아 그 이유를 물어보기.';
    } else {
        statusMsg += ' 🚨 공동체의 온도가 높습니다! 잠시 멈춤이 필요합니다.';
        missionMsg = '🙏 미션: 지금 바로 옆 친구에게 "괜찮아?"라고 말해주기.';
    }
    statusText.textContent = statusMsg;
    missionText.textContent = missionMsg;
    
    // 최근 기록 로그 업데이트
    emotionLog.innerHTML = data.slice(-5).reverse().map(entry => 
        `<li>[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.name || '익명'}: ${entry.level}점. (키워드: ${entry.keywords})</li>`
    ).join('');
}

// 페이지 로드 시 초기 데이터 불러오기
document.addEventListener('DOMContentLoaded', fetchAndDisplayData);