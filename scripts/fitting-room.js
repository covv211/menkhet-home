/* ══════════ MENKHET 피팅룸 ══════════
   - fitting-room.html 전용 (main.js는 헤더가 있는 페이지용이라 따로 둠)
   - 마네킹은 시안 사진(재킷 룩 · 니트 룩), 입은 아우터에 따라 사진만 바뀜 — 3D 마네킹은 주인님 결정으로 뺌(2026-10-25, Blender 작업물은 3d/ · models/에 보관)
   - 사이즈 판정은 숫자로: 상품 실측표(data/fitting-items.json)의 옷 둘레 − 성별 · 키 · 몸무게로 추정한 몸 둘레 = 부위별 여유 → 등급 · 추천 사이즈
     → 키 · 몸무게만이면 오차가 커서 '추정'과 정확도를 같이 보여 주고, 평소 사이즈 · 줄자 치수를 넣으면 오차가 줄어듦
   - 옷은 아우터 · 상의 · 하의 · 신발 · 가방에서 하나씩 골라 조합, 고른 옷마다 사이즈 칸에서 판정을 봄
   - 넣은 값은 이 화면에서만 계산하고 저장하거나 보내지 않음 */

/* ── 신체 치수 공식 ── */
// 부위 둘레(어깨는 너비, cm) = 평균 몸의 둘레 × (키 ÷ 평균 키)^a × (몸무게 ÷ 평균 몸무게)^b
// 사이즈코리아 8차(2020~21) 20~30대 실측값으로 맞춘 값 (남 2,446명 · 여 2,789명, 출처 · 검증은 3d/body-formula.md)
// a · b = 키 · 몸무게가 1% 늘 때 그 부위가 몇 % 느는지, 부위마다 실제 사람들이 느는 비율이라 상체 · 하체 한쪽만 찌지 않은 보통 체형이 됨
// ⚠️ 공개 전에 사이즈코리아(국가기술표준원) 영리 이용 승낙을 받거나 다른 출처 공식으로 바꿔야 함 (body-formula.md)
const GIRTH = {
    female: {
        height: 161.72, weight: 57.11,
        //         평균     a       b
        shoulder: [42.44, -0.054, 0.294],   // 위팔사이너비 (어깨 바깥 너비)
        chest:    [85.82, -0.639, 0.552],   // 젖가슴둘레 (여자 상의 사이즈 기준)
        waist:    [74.39, -0.773, 0.656],
        hip:      [94.59, -0.132, 0.404],
        thigh:    [56.44, -0.520, 0.537],
    },
    male: {
        height: 174.78, weight: 75.40,
        shoulder: [48.17, 0.142, 0.252],
        axilla:   [101.91, -0.220, 0.395],   // 겨드랑이 높이 가슴둘레 (남자 상의 사이즈 기준)
        waist:    [84.70, -0.945, 0.709],
        hip:      [98.16, -0.222, 0.409],
        thigh:    [59.15, -0.565, 0.563],
    },
};

const RANGE = {
    height: [140, 200],   // cm
    weight: [35, 130],   // kg
};
const TAPE_RANGE = {   // 줄자 치수 칸 (cm, 밖의 값은 치는 중으로 보고 쓰지 않음)
    chest: [60, 150],
    waist: [50, 150],
    hip: [70, 160],
};
const BMI_SHAPE = [15, 40];   // 공식을 쓰는 BMI 범위 (공식을 만든 실측 자료 밖은 가장 가까운 체형으로)
const DEFAULT_BMI = { female: 21, male: 22.9 };   // 몸무게 칸이 비었을 때 키에 맞춰 쓰는 BMI (여자 162cm · 55kg / 남자는 정상 BMI 위끝)
const DEFAULT_HEIGHT = { female: 162, male: 175 };   // 키 칸이 비었을 때 (한국 20~30대 여자 · 남자 평균 키 근처)

/* ── 평소 사이즈 → 몸 둘레 범위 ── */
// 사이즈마다 맞는 몸 치수 범위(cm): [S 아래끝, S~M 경계, M~L, L~XL, XL 위끝] — '평소 입는 사이즈'를 몸 둘레로 바꿀 때만 씀
// 여자 상의 · 아우터: KS K 0051:2009 젖가슴둘레 S 72~82 · M ~89 · L ~98 · XL ~109
// 남자 상의 · 아우터: KS K 0050:2009 가슴둘레 M 85~93 · L ~101 · XL ~108 (S는 M과 같은 폭 8로 77~85)
// 남자 바지: KS K 0050:2009 허리 M 70~80 · L ~90 · XL ~99 (S는 60~70)
// 여자 바지: KS에 S~XL 표기가 없어 쇼핑몰 허리 인치 25~26 · 27~28 · 29~30 · 31~32를 cm로 바꿈
const SIZES = ['S', 'M', 'L', 'XL'];
const SIZE_CHART = {
    female: { chest: [72, 82, 89, 98, 109], waist: [63.5, 67.3, 72.4, 77.5, 82.6] },
    male: { chest: [77, 85, 93, 101, 108], waist: [60, 70, 80, 90, 99] },
};
const CHEST_GIRTH = { female: 'chest', male: 'axilla' };   // 옷 가슴과 비교하는 몸 둘레 (남자는 겨드랑이 높이)
const PART_NAME = { chest: '가슴', shoulder: '어깨', waist: '허리', hip: '엉덩이', thigh: '허벅지' };

/* ── 핏 판정: 여유 = 옷 둘레(단면 × 2) − 몸 둘레(추정) ── */
// 등급 경계는 다른 세션 조사(우븐 기준 여유 구간 · 니트 완화 · 아우터 이너 여유)의 초기값 → 지인 실측으로 맞추기 전까지 '베타'
const GRADES = ['작음', '타이트', '딱 맞음', '여유', '큼'];
const GRADE_EDGES = {   // 등급 사이 경계(cm): 작음 | 타이트 | 딱 맞음 | 여유 | 큼
    chest:    [0, 5, 10, 15],
    shoulder: [-3, -1, 2, 6],   // 옷 어깨 − 몸 어깨 (드롭 · 래글런 어깨는 판정 안 함)
    waist:    [-1, 0, 3, 6],
    hip:      [0, 4, 10, 16],
    thigh:    [0, 4, 10, 16],
};
const INNER_EASE = { chest: 5, shoulder: 2 };   // 아우터는 안에 껴입을 옷만큼 경계를 옮김 (cm)
const STRETCH_EASE = { none: 0, some: -2.5, good: -5 };   // 신축 원단은 작아도 입힘 → 작음 경계는 이만큼, 타이트 경계는 절반만 내림
const FIT_EASE = { slim: -3, regular: 0, over: 8 };   // 의도한 핏: 오버핏 옷은 커도 '큼'이 아님 (허리 · 어깨는 그대로)
const PART_WEIGHT = { chest: 3, shoulder: 3, waist: 3, hip: 3, thigh: 2 };   // 추천 사이즈를 고를 때 부위 무게
const FIT_PARTS = { outer: ['chest', 'shoulder'], top: ['chest', 'shoulder'], bottom: ['waist', 'hip', 'thigh'] };
const KEY_FIT = { outer: ['chest'], top: ['chest'], bottom: ['waist', 'hip'] };   // 대표 등급 · 정확도를 정하는 부위
const GIRTH_PARTS = ['chest', 'waist', 'hip', 'thigh'];
const BORDER_RATIO = 0.75;   // 이웃 등급의 확률이 가장 그럴듯한 등급의 이만큼 넘으면 둘을 같이 보여 줌 ('딱 맞음~여유', 오차 안이라 어느 쪽인지 모름)

// 몸 추정 오차(1σ, cm): 키 · 몸무게만으로는 가슴 · 허리 · 엉덩이가 4~8cm쯤 틀림 (한 사이즈 간격과 비슷) → 판정을 단정하지 않음
const BODY_SIGMA = { chest: 4, waist: 5, hip: 3.5, thigh: 3, shoulder: 2.5 };   // 임시 어림값 (지인 실측으로 교정 전)
const TAPE_SIGMA = 1.5;   // 줄자로 직접 잰 값
const USUAL_SIGMA = 2.5;   // 평소 사이즈가 브랜드마다 다른 정도 (사이즈 범위 폭에 더함)
const CHART_SIGMA = 2.5;   // 상품 평면 실측의 둘레 오차 (단면 ±1~1.5cm)
const SHOULDER_SEAM = 0.95;   // 옷 어깨너비(봉제선 사이)와 비교하는 몸 어깨 = 위팔사이너비 × 이 값 (MakeHuman 기준 몸에서 잰 39.8 ÷ 42.0, 실측 교정 전)
const LENGTH_SIGMA = 3;   // 밑단 위치 오차(cm): 키 · 몸무게만으로는 몸통 · 다리 비율을 모름
const LEVEL_NAME = { low: '낮음', mid: '보통', high: '높음' };

// 밑단 위치를 말할 때 쓰는 몸 높이 (키에 대한 비율, MakeHuman 기준 몸 162cm에서 잰 높이와 비슷하게)
const LEVEL_RATIO = {
    neckside: 0.825,   // 옆 목점 (상의 총장을 재기 시작하는 곳)
    waist: 0.614,
    hip: 0.497,
    crotch: 0.455,
    thigh: 0.423,
    knee: 0.27,
    calf: 0.215,
    ankle: 0.045,
};
const HEM_MARKS = {   // 밑단이 가장 가까운 곳 (위 → 아래)
    top: [['허리', 'waist'], ['엉덩이', 'hip'], ['허벅지', 'thigh'], ['무릎', 'knee'], ['종아리', 'calf'], ['발목', 'ankle']],
    bottom: [['무릎', 'knee'], ['종아리', 'calf'], ['발목', 'ankle']],
};

/* ── 상품 실측표 검사 ── */
// 잘못 적힌 실측표 하나가 확신에 찬 오추천(→ 반품)이 되므로, 이상한 표는 판정에서 빼고 콘솔에 알림
const CHART_URL = 'data/fitting-items.json';
const WIDTH_MAX = 80;   // 단면 자리에 둘레를 적은 실수 (단면이 80cm를 넘는 옷은 거의 없음)
const STEP_MAX = 10;   // 이웃 사이즈 차이가 이보다 크면 오타로 봄 (보통 1~5cm)
const WIDTH_FIELDS = ['chest', 'waist', 'hip', 'thigh', 'hem'];

/* ── 옷 ── */
const ITEMS = {
    jacket: { slot: 'outer', short: '봄버 재킷' },
    coat: { slot: 'outer', short: '롱코트' },
    knit: { slot: 'top', short: '니트셔츠' },
    shirt: { slot: 'top', short: '셔츠' },
    tee: { slot: 'top', short: '티셔츠' },
    pants: { slot: 'bottom', short: '와이드 팬츠' },
    shoes: { slot: 'shoes', short: '스니커즈' },
    bag: { slot: 'bag', short: '토트백' },
};
const SLOTS = ['outer', 'top', 'bottom', 'shoes', 'bag'];

/* ── 화면 요소 ── */
const form = document.querySelector('#body-info');
const guide = form.querySelector('.guide');
const guideText = guide.textContent;
const heightInput = form.querySelector('#height');
const weightInput = form.querySelector('#weight');
const box = document.querySelector('.mannequin-box');
const photo = box.querySelector('.mannequin');
const sizePanel = box.querySelector('.size-panel');
const sizeButtons = sizePanel.querySelectorAll('.size');
const sizeFit = sizePanel.querySelector('.size-fit');
const sizeParts = sizePanel.querySelector('.size-parts');
const sizeBasis = sizePanel.querySelector('.size-basis');
const sizeNote = sizePanel.querySelector('.size-note');
const accuracy = box.querySelector('.accuracy-panel');
const accuracyToggle = accuracy.querySelector('.accuracy-toggle');
const accuracyForm = accuracy.querySelector('.accuracy-form');
const itemList = document.querySelector('.item-list');
const itemButtons = itemList.querySelectorAll('.fitting-item');

/* ── 상태: 입은 옷 · 고른 사이즈 · 사이즈를 보고 있는 옷 · 실측표 · 추천 ── */
// 처음 모습 = 시안 재킷 룩 (재킷 + 니트셔츠 + 와이드 팬츠 + 스니커즈)
const outfit = { outer: 'jacket', top: 'knit', bottom: 'pants', shoes: 'shoes', bag: null };
const chosenSize = {};   // 옷마다 직접 고른 사이즈, 없으면 추천 사이즈로 판정
let focusItem = 'jacket';
let catalog = null;   // data/fitting-items.json (불러오기 전 null)
let recos = {};   // 옷마다 추천 결과 (refresh가 매번 다시 계산)

const itemName = (id) => itemList.querySelector(`[data-item="${id}"] img`).alt;
const isWorn = (id) => outfit[ITEMS[id].slot] === id;
const itemData = (id) => (catalog && catalog.items[id]) || null;

// 그 성별 마네킹의 실측표 (판정에서 뺀 상품 · 사이즈 없는 상품은 null)
function chartOf(id, sex) {
    const item = itemData(id);
    if (!item || item.invalid || !FIT_PARTS[item.category] || !item.charts) return null;
    return item.charts[sex] || null;
}

const sizesOf = (id, sex) => {
    const chart = chartOf(id, sex);
    return chart ? SIZES.filter((size) => chart[size]) : [];
};

/* ── 몸 정보 읽기 ── */
// 빈칸은 null, 범위 밖은 NaN (치는 중에 잠깐 나오는 '17' 같은 값은 그리지 않고 넘어감)
function readField(input, [min, max]) {
    if (input.value === '') return null;
    const value = Number(input.value);
    return value >= min && value <= max ? value : NaN;
}

function readBody() {
    const sex = form.elements.sex.value;
    const height = readField(heightInput, RANGE.height);
    const weight = readField(weightInput, RANGE.weight);
    return { sex, height, weight };
}

// 정확도 칸: 평소 사이즈 · 줄자 치수 (범위 밖 값은 null로 보고 칸에 경고 표시)
function readExtra() {
    const fields = accuracyForm.elements;
    const usual = { top: fields.usualTop.value || null, bottom: fields.usualBottom.value || null };
    const tape = {};
    Object.entries(TAPE_RANGE).forEach(([part, range]) => {
        const value = readField(fields[part], range);
        fields[part].classList.toggle('warn', Number.isNaN(value));
        tape[part] = Number.isNaN(value) ? null : value;
    });
    return { usual, tape };
}

// 빈칸은 기본값으로, 체형은 BMI 15~40 안에서
function shapeBody({ sex, height, weight }) {
    const h = height || DEFAULT_HEIGHT[sex];
    const m = h / 100;
    const bmi = (weight || DEFAULT_BMI[sex] * m * m) / (m * m);
    const limited = Math.min(Math.max(bmi, BMI_SHAPE[0]), BMI_SHAPE[1]);
    return { sex, height: h, weight: limited * m * m };
}

function girthOf(body, part) {
    const table = GIRTH[body.sex];
    const [mean, a, b] = table[part];
    return mean * (body.height / table.height) ** a * (body.weight / table.weight) ** b;
}

/* ── 몸 치수 추정: 키 · 몸무게 공식 → 평소 사이즈 → 줄자 ── */
// 부위마다 { mu: 평균, sigma: 오차 } — 더 믿을 만한 값일수록 무겁게 합침 (역분산 가중 평균)
function merge(a, b) {
    const w = 1 / a.sigma ** 2 + 1 / b.sigma ** 2;
    return { mu: (a.mu / a.sigma ** 2 + b.mu / b.sigma ** 2) / w, sigma: Math.sqrt(1 / w) };
}

// 평소 사이즈 → 그 사이즈 범위의 가운데 (오차 = 범위 안에 고르게 퍼진 정도 + 브랜드마다 다른 정도)
function usualGirth(sex, measure, size) {
    const bounds = SIZE_CHART[sex][measure];
    const i = SIZES.indexOf(size);
    const width = bounds[i + 1] - bounds[i];
    return { mu: (bounds[i] + bounds[i + 1]) / 2, sigma: Math.hypot(width / Math.sqrt(12), USUAL_SIGMA) };
}

// fit = 옷과 비교할 몸 치수, source = 부위마다 어디서 온 값인지 (formula · usual · tape)
function estimateBody(body, extra) {
    const chestPart = CHEST_GIRTH[body.sex];
    const fit = {
        chest: { mu: girthOf(body, chestPart), sigma: BODY_SIGMA.chest },
        waist: { mu: girthOf(body, 'waist'), sigma: BODY_SIGMA.waist },
        hip: { mu: girthOf(body, 'hip'), sigma: BODY_SIGMA.hip },
        thigh: { mu: girthOf(body, 'thigh'), sigma: BODY_SIGMA.thigh },
        shoulder: { mu: girthOf(body, 'shoulder') * SHOULDER_SEAM, sigma: BODY_SIGMA.shoulder },
    };
    const source = { chest: 'formula', waist: 'formula', hip: 'formula', thigh: 'formula', shoulder: 'formula' };
    if (extra.usual.top) {
        fit.chest = merge(fit.chest, usualGirth(body.sex, 'chest', extra.usual.top));
        source.chest = 'usual';
    }
    if (extra.usual.bottom) {
        fit.waist = merge(fit.waist, usualGirth(body.sex, 'waist', extra.usual.bottom));
        source.waist = 'usual';
    }
    Object.entries(extra.tape).forEach(([part, value]) => {
        if (value === null) return;
        fit[part] = merge(fit[part], { mu: value, sigma: TAPE_SIGMA });
        source[part] = 'tape';
    });
    return { fit, source };
}

// 정확도: 대표 부위가 모두 줄자면 높음, 평소 사이즈나 줄자가 하나라도 있으면 보통, 공식만이면 낮음
function accuracyOf(est, parts) {
    const sources = parts.map((part) => est.source[part]);
    if (sources.every((s) => s === 'tape')) return 'high';
    return sources.some((s) => s !== 'formula') ? 'mid' : 'low';
}

/* ── 핏 판정 ── */
// 정규분포 누적확률 (Abramowitz · Stegun 7.1.26, 오차 1e-7)
function normalCdf(z) {
    const x = Math.abs(z) / Math.SQRT2;
    const t = 1 / (1 + 0.3275911 * x);
    const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

// 부위의 등급 경계: 아우터는 이너만큼, 신축 원단은 작은 쪽, 의도한 핏은 맞음 · 큰 쪽을 옮김
function edgesFor(item, part) {
    const edges = [...GRADE_EDGES[part]];
    if (item.category === 'outer' && item.inner && INNER_EASE[part]) edges.forEach((edge, i) => { edges[i] = edge + INNER_EASE[part]; });
    if (part !== 'shoulder') {
        const stretch = STRETCH_EASE[item.stretch] || 0;
        edges[0] += stretch;
        edges[1] += stretch / 2;
    }
    if (part !== 'shoulder' && part !== 'waist') {
        for (let i = 1; i < edges.length; i++) edges[i] += FIT_EASE[item.fit] || 0;
    }
    return edges;
}

// 한 사이즈의 부위별 판정: 여유 · 오차 · 등급 확률 · 보여 줄 등급(경계면 이웃 등급까지) · 비용
function judgeSize(item, row, est) {
    const parts = FIT_PARTS[item.category].filter((part) => row[part] !== undefined && !(part === 'shoulder' && item.shoulder !== 'set'));
    const rows = parts.map((part) => {
        const garment = part === 'shoulder' ? row.shoulder : row[part] * 2;   // 단면 × 2 = 둘레
        const ease = garment - est.fit[part].mu;
        const sigma = Math.hypot(est.fit[part].sigma, part === 'shoulder' ? CHART_SIGMA / 2 : CHART_SIGMA);
        const edges = edgesFor(item, part);
        const cdf = [0, ...edges.map((edge) => normalCdf((edge - ease) / sigma)), 1];
        const probs = GRADES.map((_, i) => cdf[i + 1] - cdf[i]);
        const grade = probs.indexOf(Math.max(...probs));
        const last = GRADES.length - 1;
        const next = grade === 0 ? 1 : grade === last ? last - 1 : probs[grade - 1] > probs[grade + 1] ? grade - 1 : grade + 1;
        const cost = PART_WEIGHT[part] * Math.abs(ease - (edges[1] + edges[2]) / 2) / (edges[2] - edges[1]);
        return { part, ease, sigma, probs, grade, near: probs[next] >= probs[grade] * BORDER_RATIO ? next : grade, cost };
    });
    return {
        rows,
        cost: rows.reduce((sum, r) => sum + r.cost, 0),
        tooSmall: rows.some((r) => GIRTH_PARTS.includes(r.part) && r.probs[0] > 0.5),
    };
}

const gradeLabel = (r) => (r.near === r.grade ? GRADES[r.grade] : `${GRADES[Math.min(r.grade, r.near)]}~${GRADES[Math.max(r.grade, r.near)]}`);

// 대표 부위 중 목표에서 가장 먼 줄 (사이즈 칸 아래 한 줄 요약에 씀)
function keyRow(item, judged) {
    const keys = judged.rows.filter((r) => KEY_FIT[item.category].includes(r.part));
    return keys.reduce((worst, r) => (r.cost > worst.cost ? r : worst), keys[0]);
}

// 비용(부위 무게 × 목표 구간 가운데에서 벗어난 정도)이 가장 작은 사이즈 = 추천, 그다음 = 차선 · 너무 작은 사이즈는 뺌
function recommend(id, sex, est) {
    const item = itemData(id);
    const chart = chartOf(id, sex);
    const all = sizesOf(id, sex).map((size) => ({ size, ...judgeSize(item, chart[size], est) }));
    const wearable = all.filter((j) => !j.tooSmall);
    const ranked = [...(wearable.length ? wearable : all)].sort((a, b) => a.cost - b.cost);
    return { best: ranked[0], next: ranked[1] || null, all, allSmall: !wearable.length };
}

function wornSize(id, sex) {
    if (sizesOf(id, sex).includes(chosenSize[id])) return chosenSize[id];
    return recos[id] ? recos[id].best.size : null;
}

const wornRow = (id, sex) => {
    const size = wornSize(id, sex);
    return size ? chartOf(id, sex)[size] : null;
};

const levelOf = (name, height) => LEVEL_RATIO[name] * height;   // 몸 높이(cm)

// 밑단 높이 = 재기 시작한 곳(옆 목점 · 허리) − 총장 → '무릎 아래 8cm ±3'
function hemText(item, row, height) {
    if (!row.length) return '';
    const bottom = item.category === 'bottom';
    const hem = levelOf(bottom ? 'waist' : 'neckside', height) - row.length;
    if (bottom && hem <= 1) return '바닥에 닿아요 (접어 입기)';
    const marks = HEM_MARKS[bottom ? 'bottom' : 'top'].map(([name, level]) => [name, levelOf(level, height)]);
    const [name, at] = marks.reduce((a, b) => (Math.abs(b[1] - hem) < Math.abs(a[1] - hem) ? b : a));
    const gap = Math.round(hem - at);
    const where = Math.abs(gap) < 2 ? `${name} 높이` : `${name} ${gap > 0 ? '위' : '아래'} ${Math.abs(gap)}cm`;
    return `${where} ±${LENGTH_SIGMA}`;
}

/* ── 화면 글자: 안내 문구 · 옷 칸 · 사이즈 칸 · 정확도 칸 ── */
function showWarning(entered) {
    const out = Number.isNaN(entered.height) || Number.isNaN(entered.weight);
    guide.classList.toggle('warn', out);
    guide.textContent = out ? `키는 ${RANGE.height.join('~')}cm, 몸무게는 ${RANGE.weight.join('~')}kg 사이로 넣어 주세요.` : guideText;
}

function renderItems() {
    itemButtons.forEach((button) => {
        const id = button.dataset.item;
        const reco = button.querySelector('.reco');
        button.setAttribute('aria-pressed', String(isWorn(id)));
        button.classList.toggle('active', id === focusItem);
        if (reco) reco.textContent = recos[id] ? `추천 ${recos[id].best.size}` : '';
    });
}

// 부위 한 줄: 가슴 | +14cm | 딱 맞음 (data-grade로 색, 두 등급 경계면 border)
function partRow(name, value, r) {
    const li = document.createElement('li');
    [['part', name], ['value', value], ['grade', r ? gradeLabel(r) : null]].forEach(([cls, text]) => {
        if (text === null) return;
        const span = document.createElement('span');
        span.className = cls;
        span.textContent = text;
        li.append(span);
    });
    if (r) {
        li.dataset.grade = r.grade;
        li.classList.toggle('border', r.near !== r.grade);
    } else {
        li.className = 'hem';
    }
    return li;
}

const signed = (cm) => `${cm >= 0 ? '+' : '-'}${Math.abs(Math.round(cm))}cm`;

function renderSizePanel(est, body) {
    sizePanel.hidden = !focusItem;
    if (!focusItem) return;
    const item = itemData(focusItem);
    const sizes = sizesOf(focusItem, body.sex);
    sizePanel.querySelector('.name').textContent = ITEMS[focusItem].short;
    sizePanel.classList.toggle('free', !sizes.length);
    if (!sizes.length) {
        sizeParts.replaceChildren();
        sizeNote.textContent = '';
        if (!catalog) sizeBasis.textContent = '실측표를 불러오는 중이에요.';
        else if (catalog.failed) sizeBasis.textContent = '실측표를 불러오지 못했어요.';
        else if (item && item.invalid) sizeBasis.textContent = '실측표를 확인하는 중인 상품이에요.';
        else sizeBasis.textContent = '사이즈 없는 상품이에요.';
        return;
    }
    const reco = recos[focusItem];
    const size = wornSize(focusItem, body.sex);
    const judged = reco.all.find((j) => j.size === size);
    sizeButtons.forEach((button) => {
        const value = button.dataset.size;
        button.disabled = !sizes.includes(value);
        button.classList.toggle('reco', value === reco.best.size);
        button.setAttribute('aria-pressed', String(value === size));
        button.setAttribute('aria-label', value === reco.best.size ? `${value}, 체형에 맞는 추천 사이즈` : value);
    });
    const key = keyRow(item, judged);
    sizeFit.textContent = `${size} · ${PART_NAME[key.part]} ${gradeLabel(key)}`;
    sizeFit.classList.toggle('fit', key.grade === 2 && key.near === 2);
    const hem = hemText(item, chartOf(focusItem, body.sex)[size], body.height);
    sizeParts.replaceChildren(
        ...judged.rows.map((r) => partRow(PART_NAME[r.part], signed(r.ease), r)),
        ...(hem ? [partRow(item.category === 'bottom' ? '기장' : '총장', hem, null)] : []),
    );
    // 추천 + 차선 (몸이 표 밖이면 끝 사이즈도 안 맞을 수 있다고 알림)
    const best = reco.best.size;
    const bestKey = keyRow(item, reco.best);
    let basis = `추천 ${best}`;
    if (reco.allSmall) basis += ` · 가장 큰 ${best}도 작을 수 있어요`;
    else if (best === sizes[0] && bestKey.probs[4] > 0.5) basis += ` · 가장 작은 ${best}도 클 수 있어요`;
    else if (reco.next) basis += SIZES.indexOf(reco.next.size) > SIZES.indexOf(best) ? ` · 여유 있게 ${reco.next.size}` : ` · 슬림하게 ${reco.next.size}`;
    sizeBasis.textContent = basis;
    const level = accuracyOf(est, KEY_FIT[item.category]);
    sizeNote.textContent = `정확도 ${LEVEL_NAME[level]} · ${catalog.sample ? '예시 실측표' : '상품 실측표'} 기준 추정 (숫자 = 옷 − 몸 둘레)`;
}

// 정확도 칸 버튼: 줄자 셋 다 → 높음, 하나라도 더 넣었으면 → 보통
function renderAccuracy(est) {
    accuracyToggle.querySelector('.level').textContent = LEVEL_NAME[accuracyOf(est, ['chest', 'waist', 'hip'])];
}

// 마네킹 사진: 재킷을 입었으면 재킷 룩, 아니면 니트 룩 (시안 사진 두 장)
function showPhoto() {
    const jacket = outfit.outer === 'jacket';
    photo.src = `images/fitting/mannequin-${jacket ? 'jacket' : 'knit'}.webp`;
    photo.alt = `${itemName(jacket ? 'jacket' : 'knit')}을 입은 마네킹`;
}

// 몸 · 옷 · 사이즈가 바뀔 때마다 한 곳에서 화면을 다시 맞춤
function refresh() {
    const entered = readBody();
    const body = shapeBody(entered);
    const est = estimateBody(body, readExtra());
    recos = {};
    Object.keys(ITEMS).forEach((id) => {
        if (sizesOf(id, body.sex).length) recos[id] = recommend(id, body.sex, est);
    });
    renderItems();
    renderSizePanel(est, body);
    renderAccuracy(est);
    showPhoto();
}

/* ── 옷 고르기: 안 입은 옷 → 입힘(같은 칸 옷은 벗김), 입은 옷 → 사이즈 보기, 한 번 더 → 벗김 ── */
itemButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const id = button.dataset.item;
        const slot = ITEMS[id].slot;
        if (!isWorn(id)) {
            outfit[slot] = id;
            focusItem = id;
        } else if (focusItem !== id) {
            focusItem = id;
        } else {
            takeOff(id);
        }
        refresh();
    });
});

function takeOff(id) {
    outfit[ITEMS[id].slot] = null;
    focusItem = SLOTS.map((slot) => outfit[slot]).find(Boolean) || null;
}

sizePanel.querySelector('.take-off').addEventListener('click', () => {
    takeOff(focusItem);
    refresh();
});

sizeButtons.forEach((button) => {
    button.addEventListener('click', () => {
        chosenSize[focusItem] = button.dataset.size;
        refresh();
    });
});

// 옷 목록은 마우스 휠로도 가로로 넘김
itemList.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    itemList.scrollLeft += e.deltaY;
}, { passive: false });

/* ── 정확도 칸: 열고 닫기 · 넣는 즉시 반영 ── */
accuracyToggle.addEventListener('click', () => {
    const open = accuracyToggle.getAttribute('aria-expanded') !== 'true';
    accuracyToggle.setAttribute('aria-expanded', String(open));
    accuracyForm.hidden = !open;
});

accuracyForm.addEventListener('input', () => refresh());
accuracyForm.addEventListener('submit', (e) => {
    e.preventDefault();
});

/* ── 닫기: 같은 사이트에서 들어왔으면 그 페이지로 돌아감 ── */
document.querySelector('.btn-close').addEventListener('click', (e) => {
    if (!document.referrer || new URL(document.referrer).origin !== location.origin) return;
    e.preventDefault();
    history.back();
});

/* ── 상품 실측표 불러오기 · 검사 ── */
// 숫자가 아닌 값 · 단면 자리의 둘레 · 사이즈가 커지는데 줄어드는 치수 · 너무 큰 사이즈 간격 → 그 상품은 판정에서 뺌
function checkCatalog(data) {
    const items = data.items || {};
    Object.entries(items).forEach(([id, item]) => {
        if (!item.charts) return;
        const problems = [];
        if (!FIT_PARTS[item.category]) problems.push(`분류 ${item.category}`);
        Object.entries(item.charts).forEach(([sex, chart]) => {
            const sizes = SIZES.filter((size) => chart[size]);
            sizes.forEach((size, i) => {
                (KEY_FIT[item.category] || []).forEach((part) => {
                    if (chart[size][part] === undefined) problems.push(`${sex} ${size} ${part} 없음`);
                });
                Object.entries(chart[size]).forEach(([field, value]) => {
                    if (typeof value !== 'number' || !(value > 0)) problems.push(`${sex} ${size} ${field} 값 ${value}`);
                    if (WIDTH_FIELDS.includes(field) && value > WIDTH_MAX) problems.push(`${sex} ${size} ${field} ${value}cm는 둘레 같음 (단면으로)`);
                    const prev = i ? chart[sizes[i - 1]][field] : undefined;
                    if (prev !== undefined && (value < prev || value - prev > STEP_MAX)) problems.push(`${sex} ${sizes[i - 1]}→${size} ${field} ${prev}→${value}`);
                });
            });
        });
        if (problems.length) {
            item.invalid = true;
            console.warn(`[피팅룸] ${id} 실측표를 판정에서 뺌: ${problems.join(', ')}`);
        }
    });
    return { sample: data.sample !== false, items };
}

/* ── 입력: 칸을 고칠 때마다 바로 반영, 범위 밖 값은 칸을 떠날 때 알림 ── */
form.addEventListener('input', () => {
    const entered = readBody();
    if (Number.isNaN(entered.height) || Number.isNaN(entered.weight)) return;
    showWarning(entered);
    refresh();
});

form.addEventListener('change', () => {
    showWarning(readBody());
});

form.addEventListener('submit', (e) => {
    e.preventDefault();   // 엔터를 눌러도 페이지가 다시 열리지 않게
});

refresh();

fetch(CHART_URL)
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
    .then((data) => {
        catalog = checkCatalog(data);
        refresh();
    })
    .catch(() => {
        catalog = { sample: true, items: {}, failed: true };
        refresh();
    });
