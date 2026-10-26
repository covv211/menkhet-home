/* ══════════ MENKHET 피팅룸 ══════════
   - fitting-room.html 전용 (main.js는 헤더가 있는 페이지용이라 따로 둠)
   - 수정 시안 231:1372: 위에서 성별 · 키 · 몸무게를 고르고, 왼쪽 옷 칸에서 코트 · 셔츠 · 바지 · 로퍼 색을 골라 마네킹에 입혀 봄
   - 키 · 몸무게 구간은 주인님 표(시안 232:1695 여자 기준 · 232:2147 남자 기준) → 성별을 바꾸면 키 · 몸무게를, 키를 바꾸면 몸무게를 비움
   - 고른 몸 정보는 칸 이름 옆에 보여 주고, 그 체형의 사진(조합 사진 · 기본 마네킹)이 있으면 마네킹을 그 체형으로 바꿈 (저장하거나 보내지 않음)
   - 마네킹 사진은 mannequinPhoto() 한 곳에서 정함
     · 여자 · 키 · 몸무게를 다 골랐고 조합 사진이 없는 체형 → 그 체형의 코디 없는 기본 마네킹 정면(images/fitting/body/women/<키>/<몸무게>.webp, 흰 티 · 회색 레깅스)
       옷 · 사이즈를 골라도 사진은 그대로, 고른 건 기억해 뒀다가 조합 사진 체형으로 돌아오면 입힘
     · 그 밖(고르기 전 · 일부만 고름 · 남자 · 여자 165~170cm · 65~70kg) → 조합 사진 체형(지금은 여자 165~170cm · 65~70kg뿐)
       셔츠 하늘색 · 바지 검정 · 로퍼 검정이면 고른 사이즈의 코트 사진(outfit/…/size/coat-<색>_<사이즈>.webp, 3색 × 4사이즈), 아니면 체형마다 4종 각 3색(3 × 3 × 3 × 3) = 81가지 조합 사진(코트 M) 중 고른 색의 사진
   - 지금 사진에서 옷 한 벌 · 사이즈 하나만 바꾼 사진을, 키를 고르면 그 키의 몸무게별 기본 마네킹을 미리 받아 둬서 바로 바뀜
   - 사진 · 실측 그림은 0.3s 등속 페이드로 바뀜 (주인님 맥 '동작 줄이기' — 위치는 그대로, 투명도만)
   - 목록 · 옷 칸은 한 번에 하나만 열림: 바깥을 누르거나 다른 곳으로 Tab → 닫힘, Esc → 닫고 연 칸으로 포커스
   - 마네킹 사진(683×1024)은 모두 한 규칙으로 맞춤: 사람 키(똥머리 위 ~ 발끝) = 980px × 키 구간 가운데 값 / 177.5cm, 발끝은 y 1004, 가운데 정렬 → 같은 키 구간은 몸무게를 바꿔도 키가 그대로, 키 구간을 바꾸면 키가 바뀜 (새 사진도 이 규칙으로)
   - 상품 상세 창(women-coat.html)은 이 페이지를 iframe(?embed=1)으로 띄움 → 칸이 준비되면 상세 창에 알리고, 닫기 · Esc(열린 목록 · 옷 칸이 없을 때)는 페이지를 떠나지 않고 상세 창에 닫으라고 알림, 첫 칸 · 마지막 칸에서 Tab을 넘기면 상세 창 사진 칸으로 가라고 알림
   - 예전 숫자 판정(상품 실측표 data/fitting-items.json · 정확도 칸 · 부위별 여유)과 아래 옷 목록은 수정 시안에서 빠져서 지움 (JSON 파일은 남겨 둠) */

/* ── 상품 상세 창 안에 띄울 때 (fitting-room.html?embed=1) ── */
// 주소에 embed가 있어도 iframe 안이 아니면(주소를 바로 열면) 그냥 피팅룸 페이지
const EMBED = new URLSearchParams(location.search).has('embed') && window.parent !== window;
if (EMBED) document.body.classList.add('embed');   // dim · 위아래 여백 없이 창이 iframe을 꽉 채움 (style.css)

// 상세 창에 피팅룸을 닫으라고 알림 → 상세 창이 오른쪽으로 내보내고 '피팅룸으로 이동'에 포커스 (같은 사이트 창에만 보냄, 받는 쪽도 보낸 곳을 확인 — main.js)
// byKey: 키보드(Esc · 닫기에서 Enter)로 닫았는지 → 상세 창이 포커스 테두리를 그릴지 정함 (브라우저는 문서마다 마지막 입력을 따로 기억해서 iframe 안 키보드를 상세 창이 모름)
function closeEmbed(byKey) {
    parent.postMessage({ type: 'menkhet-fitting-close', byKey }, location.origin);
}

// 상세 창에 피팅룸 밖으로 Tab을 넘기라고 알림 → 상세 창이 피팅룸 앞 · 뒤 칸(썸네일 · 사진 칸)에 포커스 (main.js)
// back: Shift+Tab으로 첫 칸 앞으로 나감 (아니면 Tab으로 마지막 칸 뒤로)
// 양쪽 다 상세 창이 옮김 → 순서가 main.js tabItems를 따르고 테두리도 그려짐 (Tab은 그냥 두면 피팅룸 뒤에 칸이 없어 브라우저 주소창으로 감)
function tabOutEmbed(back) {
    parent.postMessage({ type: 'menkhet-fitting-tab', back }, location.origin);
}

/* ── 키 · 몸무게 구간 (주인님 표) ── */
const STEP = 5;   // 구간 폭 (cm · kg)
const HEIGHT_RANGE = {   // 성별마다 키 [첫 구간 시작, 끝 구간 끝] (cm)
    female: [150, 180],
    male: [160, 190],
};
const WEIGHT_RANGE = {   // 키 구간마다 몸무게 [첫 구간 시작, 끝 구간 끝] (kg)
    female: {
        '150~155': [40, 60],
        '155~160': [40, 60],
        '160~165': [40, 60],
        '165~170': [50, 70],
        '170~175': [50, 70],
        '175~180': [55, 80],
    },
    male: {
        '160~165': [55, 80],
        '165~170': [55, 80],
        '170~175': [60, 90],
        '175~180': [60, 95],
        '180~185': [65, 95],
        '185~190': [65, 100],
    },
};
const UNIT = { height: 'cm', weight: 'kg' };
const ORDER = ['sex', 'height', 'weight'];   // 앞 칸을 바꾸면 뒤 칸은 비움

// [시작, 끝] → ['150~155', '155~160', …]
function ranges([from, to]) {
    const list = [];
    for (let start = from; start < to; start += STEP) list.push(`${start}~${start + STEP}`);
    return list;
}

/* ── 사진 한 자리(마네킹 · 실측 그림) 바꾸기 ──
   새 사진을 다 받은 뒤 지금 사진 바로 뒤에 넣고 0.3s 등속으로 띄움(.active는 style.css) → 다 뜨면 아래 사진을 지움
   빨리 연달아 고르면 마지막에 고른 사진만 띄움 */
function imageSlot(first) {
    const name = first.classList[0];   // 'mannequin' · 'size-guide'
    let top = first;   // 지금 맨 위 사진
    let wanted = first.getAttribute('src');

    return (src, alt) => {
        if (src === wanted) return;   // 이미 띄웠거나 받는 중인 사진 → 그대로 (기본 마네킹일 때 옷 · 사이즈를 골라도 다시 뜨지 않게)
        wanted = src;
        const next = top.cloneNode();
        next.classList.remove('active');
        next.src = src;
        next.alt = alt;
        next.decode().catch(() => {}).then(() => {
            if (wanted !== src) return;   // 받는 사이 다른 사진을 고름
            top.after(next);
            top.alt = '';   // 사라지는 사진은 스크린리더가 읽지 않게
            top = next;
            next.getBoundingClientRect();   // 투명한 상태를 한 번 그려야 0부터 페이드됨
            next.classList.add('active');
            const clear = () => {
                if (top !== next) return;   // 그 사이 더 새 사진이 올라옴 → 그 사진이 지움
                next.parentElement.querySelectorAll(`.${name}`).forEach((img) => {
                    if (img !== next) img.remove();
                });
            };
            next.addEventListener('transitionend', clear, { once: true });
            setTimeout(clear, 400);   // 페이드(0.3s)가 끝나지 않는 경우(탭 숨김 등)에도 지움
        });
    };
}

// 나중에 쓸 사진을 브라우저 캐시에 받아 둠 (같은 주소는 한 번만)
const preloaded = new Set();
function preload(src) {
    if (preloaded.has(src)) return;
    preloaded.add(src);
    new Image().src = src;
}

// 페이지를 다 그린 뒤 한가할 때 (Safari는 requestIdleCallback이 없어 잠깐 뒤에)
function whenIdle(work) {
    if ('requestIdleCallback' in window) requestIdleCallback(work, { timeout: 2000 });
    else setTimeout(work, 300);
}

/* ══════════ 몸 정보: 성별 · 키 · 몸무게 ══════════ */
const fields = {};
ORDER.forEach((name) => {
    const field = document.querySelector(`.field.${name}`);
    fields[name] = {
        field,
        toggle: field.querySelector('.toggle'),
        selected: field.querySelector('.selected'),
        list: field.querySelector('.select-list'),
        hint: field.querySelector('.hint'),   // '성별을 먼저 골라 주세요' 같은 안내 줄 (성별 칸은 없음)
    };
});

const chosen = { sex: null, height: null, weight: null };   // 처음엔 아무것도 고르지 않음
let openName = null;   // 열린 목록의 칸 이름

// 목록 줄 하나: 값 버튼 (고른 줄은 aria-pressed="true")
function optionItem(value, text) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    button.dataset.value = value;
    button.setAttribute('aria-pressed', 'false');
    button.textContent = text;
    li.append(button);
    return li;
}

// 키 · 몸무게 목록: 앞 칸을 고르기 전에는 안내 줄만
function fillList(name, values) {
    const { list, hint } = fields[name];
    list.replaceChildren(...(values ? values.map((value) => optionItem(value, `${value}${UNIT[name]}`)) : [hint]));
}

// 고른 값 → 칸 이름 옆 글자 · 목록의 고른 줄 표시
function render() {
    ORDER.forEach((name) => {
        const { list, selected } = fields[name];
        let text = '';
        list.querySelectorAll('.option').forEach((button) => {
            const on = button.dataset.value === chosen[name];
            button.setAttribute('aria-pressed', String(on));
            if (on) text = button.textContent;
        });
        selected.textContent = text;
    });
}

function choose(name, value) {
    if (chosen[name] === value) return;
    chosen[name] = value;
    ORDER.slice(ORDER.indexOf(name) + 1).forEach((after) => { chosen[after] = null; });
    fillList('height', chosen.sex && ranges(HEIGHT_RANGE[chosen.sex]));
    fillList('weight', chosen.height && ranges(WEIGHT_RANGE[chosen.sex][chosen.height]));
    render();
    changeBody();
}

/* ── 목록 열고 닫기 ── */
function closeList(focusToggle) {
    if (!openName) return;
    const { list, toggle } = fields[openName];
    openName = null;
    list.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (focusToggle) toggle.focus();
}

// 열면 고른 줄(없으면 첫 줄 · 안내 줄)로 포커스 → 키보드는 바로 위아래로 고르고, 스크린리더는 안내 문구를 읽음
function openList(name) {
    closeList(false);
    const { list, toggle } = fields[name];
    openName = name;
    list.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    (list.querySelector('[aria-pressed="true"]') || list.querySelector('.option, .hint')).focus();
}

// 시안처럼 칸 어디를 눌러도(이름 · 고른 값 · 갈매기표) 여닫음, 목록 안은 줄 고르기 (줄은 다시 그려지므로 칸에 한 번만 걸어 둠)
ORDER.forEach((name) => {
    const { field, list } = fields[name];
    field.addEventListener('click', (e) => {
        if (list.contains(e.target)) {
            const option = e.target.closest('.option');
            if (!option) return;
            choose(name, option.dataset.value);
            closeList(true);
            return;
        }
        if (openName === name) closeList(false);
        else openList(name);
    });
});

/* ══════════ 옷 칸 · 마네킹 ══════════ */
const sideItems = [...document.querySelectorAll('.side-item')];   // 코트 · 셔츠 · 바지 · 로퍼 (사진 파일 이름 순서와 같음)
const outfit = {};   // 부위 → 입은 색, 처음 값은 HTML의 aria-pressed="true"
sideItems.forEach((item) => {
    outfit[item.dataset.part] = item.querySelector('.side-option[aria-pressed="true"]').dataset.color;
});
const dressMannequin = imageSlot(document.querySelector('.mannequin'));
let openItem = null;   // 펼친 옷 칸

// 체형별 조합 사진 폴더 (images/fitting/outfit/<성별>/<키>/<몸무게>) → 지금은 주인님이 만든 여자 165~170cm · 65~70kg 81장뿐, 다른 체형은 사진이 생기면 여기에 더함
const OUTFIT_BODIES = ['women/165-170cm/65-70kg'];
const DEFAULT_BODY = OUTFIT_BODIES[0];   // 고르기 전 · 일부만 고름 · 기본 마네킹 사진도 없는 몸(남자)은 이 체형으로 보여 줌
const BODY_DIR = { female: 'women', male: 'men' };
// 코디 없는 기본 마네킹 정면이 있는 성별 (images/fitting/body/<성별>/<키>/<몸무게>.webp) → 여자 표 25체형 중 조합 사진 체형을 뺀 24장, 남자는 사진이 생기면 더함
const PLAIN_SEXES = ['female'];
// 코트 사이즈 사진이 있는 체형 (images/fitting/outfit/<체형>/size/coat-<색>_<사이즈>.webp, 주인님 코트 3색 × 4사이즈 12장)
const SIZE_BODIES = ['women/165-170cm/65-70kg'];
const SIZE_OUTFIT = { shirt: 'skyblue', pants: 'black', loafers: 'black' };   // 사이즈 사진 12장은 셔츠 · 바지 · 로퍼가 이 색으로 고정 → 이 차림일 때만 사이즈 사진을 씀

// 성별 · 키 · 몸무게 → 체형 이름 ('female', '160~165', '50~55' → 'women/160-165cm/50-55kg')
const bodyName = (sex, height, weight) => `${BODY_DIR[sex]}/${height.replace('~', '-')}cm/${weight.replace('~', '-')}kg`;
const plainSrc = (body) => `images/fitting/body/${body}.webp`;

// 고른 성별 · 키 · 몸무게 → 체형 이름 (셋 다 골랐을 때만, 아니면 null)
function chosenBody() {
    const { sex, height, weight } = chosen;
    return sex && height && weight ? bodyName(sex, height, weight) : null;
}

// 조합 사진을 입힐 체형 폴더: 고른 체형의 조합 사진이 있으면 그 체형, 아니면 기본 체형
function bodyDir() {
    const body = chosenBody();
    return OUTFIT_BODIES.includes(body) ? body : DEFAULT_BODY;
}

// 기본 마네킹으로 보여 줄 체형: 셋 다 골랐고 그 체형의 조합 사진은 없지만 기본 마네킹은 있을 때만, 아니면 null
function plainBody() {
    const body = chosenBody();
    return body && !OUTFIT_BODIES.includes(body) && PLAIN_SEXES.includes(chosen.sex) ? body : null;
}

// 조합 → 사진 주소 (images/fitting/outfit/women/165-170cm/65-70kg/coat-black_shirt-skyblue_pants-black_loafers-black.webp)
function outfitSrc(colors, body = bodyDir()) {
    return `images/fitting/outfit/${body}/${sideItems.map((item) => `${item.dataset.part}-${colors[item.dataset.part]}`).join('_')}.webp`;
}

// 조합 · 사이즈 → 코트 사이즈 사진 주소 (…/65-70kg/size/coat-black_m.webp), 사이즈 사진 차림 · 체형이 아니면 null
function sizeSrc(colors, size, body = bodyDir()) {
    const fixed = SIZE_BODIES.includes(body) && Object.keys(SIZE_OUTFIT).every((part) => colors[part] === SIZE_OUTFIT[part]);
    return fixed ? `images/fitting/outfit/${body}/size/coat-${colors.coat}_${size}.webp` : null;
}

// 마네킹 사진을 정하는 곳 → { src, alt } (지금 고른 옷 · 사이즈, 미리 받을 때는 하나만 바꿔 본 옷 · 사이즈)
//   1. 기본 마네킹 체형 → 그 체형 사진 (옷 · 사이즈와 상관없음)
//   2. 그 밖에는 조합 사진 체형: 사이즈 사진 차림이면 고른 사이즈의 코트 사진(M도 사이즈 사진 → S · M · L · XL이 같은 묶음 안에서 바뀜), 아니면 코트 M 조합 사진
function mannequinPhoto(colors = outfit, size = wornSize) {
    const plain = plainBody();
    if (plain) return { src: plainSrc(plain), alt: `${fields.sex.selected.textContent} ${chosen.height}cm · ${chosen.weight}kg 마네킹 (코디 사진 준비 중)` };
    const sized = sizeSrc(colors, size);
    const names = sideItems.map((item) => {
        const part = item.dataset.part;
        const name = item.querySelector(`.side-option[data-color="${colors[part]}"] img`).alt;
        return part === 'coat' && sized ? `${name} ${size.toUpperCase()} 사이즈` : name;   // '코트 검정 M 사이즈'
    });
    return { src: sized || outfitSrc(colors), alt: `${names.join(', ')} 차림의 마네킹` };
}

// 지금에서 하나만 바꾼 사진 → 옷 칸 · 사이즈에서 무엇을 골라도 바로 바뀜
// 한 벌만 다른 색으로 바꾼 8장 + 사이즈 사진 차림이면 지금 코트 색의 다른 사이즈 3장 (기본 마네킹일 때는 옷 · 사이즈를 골라도 그대로라 받지 않음)
function preloadNeighbors() {
    if (plainBody()) return;
    sideItems.forEach((item) => {
        const part = item.dataset.part;
        item.querySelectorAll('.side-option').forEach((button) => {
            if (button.dataset.color !== outfit[part]) preload(mannequinPhoto({ ...outfit, [part]: button.dataset.color }).src);
        });
    });
    sizeChips.forEach((chip) => {
        if (chip.dataset.size !== wornSize) preload(mannequinPhoto(outfit, chip.dataset.size).src);   // 조합 사진 차림이면 지금 사진과 같은 주소라 다시 받지 않음
    });
}

// 여자 키까지 골랐으면 그 키의 몸무게 구간마다 기본 마네킹 → 몸무게를 고르면 바로 바뀜 (조합 사진 체형은 빼고 3~5장)
function preloadBodies() {
    const { sex, height } = chosen;
    if (!height || !PLAIN_SEXES.includes(sex)) return;
    ranges(WEIGHT_RANGE[sex][height]).forEach((weight) => {
        const body = bodyName(sex, height, weight);
        if (!OUTFIT_BODIES.includes(body)) preload(plainSrc(body));
    });
}

// 고른 색 → 칸 표시(aria-pressed · 접혔을 때 보일 칸 --index) · 마네킹 사진 · 대체 글
function wear(item, option) {
    const options = [...item.querySelectorAll('.side-option')];
    options.forEach((button) => button.setAttribute('aria-pressed', String(button === option)));
    item.style.setProperty('--index', options.indexOf(option));
    outfit[item.dataset.part] = option.dataset.color;
    dress();
}

// 지금 몸 · 옷 · 사이즈의 사진으로 마네킹을 바꾸고(같은 사진이면 그대로), 다음에 고를 만한 사진을 미리 받아 둠
function dress() {
    const { src, alt } = mannequinPhoto();
    dressMannequin(src, alt);
    whenIdle(preloadNeighbors);
}

// 성별 · 키 · 몸무게를 바꾸면 그 몸의 사진으로 다시 입힘 (기본 마네킹 ↔ 조합 사진 체형, 사진이 같으면 그대로) + 고를 만한 몸무게의 기본 마네킹을 받아 둠
function changeBody() {
    dress();
    whenIdle(preloadBodies);
}

// 칸을 여닫는 건 입은 색 버튼 하나 → aria-expanded는 그 버튼에만 (다른 두 색은 고르기만 하는 버튼)
function markExpanded(item, open) {
    item.querySelectorAll('.side-option').forEach((button) => {
        if (button.getAttribute('aria-pressed') === 'true') button.setAttribute('aria-expanded', String(open));
        else button.removeAttribute('aria-expanded');
    });
}

function closeRow(focusChosen) {
    if (!openItem) return;
    const item = openItem;
    openItem = null;
    item.classList.remove('active');
    markExpanded(item, false);
    if (focusChosen) item.querySelector('.side-option[aria-pressed="true"]').focus();
}

function openRow(item) {
    closeRow(false);
    openItem = item;
    item.classList.add('active');
    markExpanded(item, true);
}

// 접힌 칸에는 입은 색 하나만 보임 → 누르면 펼치기, 펼친 칸에서 색을 누르면 입히고 접음 (입은 색을 다시 누르면 그대로 접기만)
sideItems.forEach((item) => {
    item.addEventListener('click', (e) => {
        const option = e.target.closest('.side-option');
        if (!option) return;
        if (openItem !== item) {
            openRow(item);
            return;
        }
        if (option.getAttribute('aria-pressed') !== 'true') wear(item, option);
        closeRow(false);
    });
});

/* ══════════ 사이즈 ══════════ */
const SIZE_GUIDE_ALT = {   // 실측 그림 대체 글 (그림 속 치수 그대로)
    s: 'S(55) 실측: 어깨 38cm, 가슴단면 44.5cm, 허리단면 40.5cm, 총장 62cm, 소매길이 58cm, 소매통 16.5cm',
    m: 'M(66) 실측: 어깨 39.5cm, 가슴단면 49cm, 허리단면 45cm, 총장 63.5cm, 소매길이 59cm, 소매통 17.5cm',
    l: 'L(77) 실측: 어깨 41cm, 가슴단면 53cm, 허리단면 49cm, 총장 65cm, 소매길이 60cm, 소매통 18.5cm',
    xl: 'XL(88) 실측: 어깨 42.5cm, 가슴단면 58cm, 허리단면 54cm, 총장 66.5cm, 소매길이 61cm, 소매통 19.5cm',
};
const sizeChips = [...document.querySelectorAll('.size-panel .size')];
let wornSize = sizeChips.find((chip) => chip.getAttribute('aria-pressed') === 'true').dataset.size;   // 고른 사이즈, 처음 값은 HTML의 aria-pressed="true"(M)
const showSizeGuide = imageSlot(document.querySelector('.size-guide'));
const guideSrc = (size) => `images/fitting/size-guide-${size}.svg`;

// 고른 칸만 진하게, 실측 그림은 0.3s 등속으로 바뀜 (고른 칸을 다시 누르면 그대로)
// 마네킹도 다시 입힘 → 사이즈 사진 차림이면 코트가 그 사이즈로, 아니면 사진이 그대로라 실측 그림만 바뀜
sizeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
        if (chip.getAttribute('aria-pressed') === 'true') return;
        sizeChips.forEach((button) => button.setAttribute('aria-pressed', String(button === chip)));
        wornSize = chip.dataset.size;
        showSizeGuide(guideSrc(wornSize), SIZE_GUIDE_ALT[wornSize]);
        dress();
    });
});

/* ══════════ 바깥 누르기 · 포커스 · 키보드 (목록 · 옷 칸 공통) ══════════ */
// 바깥을 누르면 닫음
document.addEventListener('click', (e) => {
    if (openName && !fields[openName].field.contains(e.target)) closeList(false);
    if (openItem && !openItem.contains(e.target)) closeRow(false);
});

// Tab으로 칸 밖에 포커스가 가면 닫음 (Safari는 버튼을 눌러도 포커스가 옮겨 가지 않아서 focusout 대신 focusin으로 봄)
document.addEventListener('focusin', (e) => {
    if (openName && !fields[openName].field.contains(e.target)) closeList(false);
    if (openItem && !openItem.contains(e.target)) closeRow(false);
});

// 상세 창 안에서는 상세 창 쪽을 누르면(포커스가 iframe 밖으로 나가면) 닫음 — 바깥 누르기가 이 페이지에 오지 않아서
if (EMBED) {
    addEventListener('blur', () => {
        closeList(false);
        closeRow(false);
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (EMBED && !openName && !openItem) closeEmbed(true);   // 열린 목록 · 옷 칸부터 닫고, 다 닫혀 있으면 피팅룸을 닫음
        closeList(true);
        closeRow(true);
        return;
    }
    // 상세 창 안에서는 피팅룸 끝에서 상세 창 사진 칸으로 넘어감 (피팅룸이 열려도 사진은 비교해 보게 그대로 — 주인님 요청): 닫기 → 사진 칸, 성별에서 Shift+Tab → 썸네일
    if (EMBED && e.key === 'Tab') {
        const first = fields.sex.toggle;
        const last = document.querySelector('.btn-close');
        if (e.shiftKey && (document.activeElement === first || document.activeElement === document.body)) {
            e.preventDefault();
            tabOutEmbed(true);
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            tabOutEmbed(false);
        }
        return;
    }
    if (!openName || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    const options = [...fields[openName].list.querySelectorAll('.option')];
    if (!options.length) return;
    e.preventDefault();   // 페이지가 스크롤되지 않게
    const down = e.key === 'ArrowDown';
    const now = options.indexOf(document.activeElement);
    const next = now === -1 ? (down ? 0 : options.length - 1) : (now + (down ? 1 : -1) + options.length) % options.length;
    options[next].focus();
});

/* ══════════ 닫기: 같은 사이트에서 들어왔으면 그 페이지로 돌아감 ══════════ */
// 새 탭으로 열었으면(⌘-클릭) 돌아갈 기록이 없어서 링크대로 메인으로, 상세 창 안에서는 페이지를 떠나지 않고 상세 창에 알림
document.querySelector('.btn-close').addEventListener('click', (e) => {
    if (EMBED) {
        e.preventDefault();
        closeEmbed(e.detail === 0);   // 키보드 Enter로 누른 클릭은 detail 0
        return;
    }
    if (!document.referrer || new URL(document.referrer).origin !== location.origin || history.length < 2) return;
    e.preventDefault();
    history.back();
});

// 상세 창 안에서는 칸 · 버튼이 다 준비됐다고 알림 → 상세 창이 사진을 다 받기(load) 전에 내용을 보여 주고 포커스를 옮김 (느린 첫 열기에서 포커스가 창 밖에 머물지 않게)
// defer 스크립트라 HTML은 다 읽은 뒤, 메시지는 이 파일의 이벤트를 다 건 다음에 도착함
if (EMBED) parent.postMessage({ type: 'menkhet-fitting-ready' }, location.origin);

// 다 그린 뒤 한가할 때: 한 벌 · 사이즈 하나만 바꾼 마네킹 사진 11장 · 나머지 실측 그림 3장
addEventListener('load', () => whenIdle(() => {
    preloadNeighbors();
    sizeChips.forEach((chip) => preload(guideSrc(chip.dataset.size)));
}));
