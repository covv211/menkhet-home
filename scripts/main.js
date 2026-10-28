/* ══════════ MENKHET 메인 ══════════
   - index.html · women-coat.html이 같이 씀 → 페이지에 없는 요소는 건너뜀
   - 헤더 전체 메뉴(.sub): 햄버거 → 1차 → 2차 → 3차 메뉴, 단계마다 하나만 열림 (0.3s 왼쪽→오른쪽 펼침 · 밑줄은 style.css)
   - 검색: 결과 페이지가 정해지기 전이라 제출만 막음
   - 히어로 Swiper: 한 장씩 옆으로 1.5s 등속, 자동 넘김 (동작 줄이기여도 넘김 그대로 — 주인님 지정)
   - 랭킹 · 추천 코디(예전 나라별 룩) · 여자 코트 Swiper, 프로모션 두 줄 흐름
   - 여자 코트 상품 상세 창: 롱코트 01 카드를 누르면 페이지 위에 열림 (주소 해시 · 뒤로 가기와 맞춤, 0.3s 페이드는 style.css)
   - 상세 창 썸네일: 코트 색 줄 + 모델 착용 세 줄(셔츠 · 바지 · 로퍼), 피팅룸 옷 칸처럼 누르면 펼쳐지고 고르면 그 사진으로, 넘겨 보면 가운데 사진에 맞춰 바뀜
   - 상세 창 컬러 · 사이즈 칸: 누르면 아래로 목록, 컬러를 고르면 그 색 사진으로 옮기고 사이즈 목록이 그 색의 S ~ XL로
   - 상세 창 오른쪽 끝 '<' 칸: 다른 페이지로 가지 않고 창 오른쪽 끝에서 피팅룸(fitting-room.html?embed=1 iframe)이 밀려 들어옴 (0.3s 등속은 style.css) */

/* ── 헤더 전체 메뉴 ── */
const sub = document.querySelector('.sub');
const bigMenu = sub.querySelector('.big-menu');
const menuButtons = sub.querySelectorAll('.menu');

// scope 안의 열린 메뉴를 모든 단계까지 닫음 (scope를 안 주면 전체 메뉴 전부)
function closeDrops(scope = sub) {
    scope.querySelectorAll('.menu').forEach((button) => {
        button.parentElement.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
    });
}

function toggleSub(open) {
    sub.classList.toggle('active', open);
    bigMenu.setAttribute('aria-expanded', String(open));
    if (!open) closeDrops();   // 1차 메뉴를 닫을 때 열린 2 · 3차 메뉴도 같이 닫음
}

bigMenu.addEventListener('click', () => {
    toggleSub(!sub.classList.contains('active'));
});

// 1차 · 2차 어느 단계든 같은 동작: 같은 목록의 다른 메뉴와 그 아래 단계를 닫고 누른 메뉴만 여닫음
// (아래 단계까지 같이 닫아야 숨은 목록 안에서 visibility: visible로 남는 3차 메뉴가 없음)
menuButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const item = button.parentElement;
        const open = !item.classList.contains('active');
        closeDrops(item.parentElement);   // 단계마다 하나만 열림
        item.classList.toggle('active', open);
        button.setAttribute('aria-expanded', String(open));
    });
});

// 메뉴 밖을 누르거나 Esc를 누르면 전부 닫음
document.addEventListener('click', (e) => {
    if (sub.classList.contains('active') && !sub.contains(e.target)) toggleSub(false);
});

// 메뉴 안의 링크를 누르면 닫음 (여자 코트 페이지 안에서 다른 코트 섹션으로 옮길 때 메뉴가 화면을 가리지 않게)
sub.addEventListener('click', (e) => {
    if (e.target.closest('a')) toggleSub(false);
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !sub.classList.contains('active')) return;
    toggleSub(false);
    bigMenu.focus();
});

/* ── 검색 ── */
document.querySelector('#search').addEventListener('submit', (e) => {
    e.preventDefault();   // 검색 결과 페이지가 생기면 form action으로 연결
});

/* ── 히어로 Swiper ── */
const SPEED = 1500;   // 넘김 1.5s (등속은 style.css의 linear)
const DELAY = 4000;   // 자동 넘김 간격 (voiden 히어로와 같은 값)
const hero = document.querySelector('.hero');

if (window.Swiper && hero) {
    const heroSwiper = new Swiper('.hero-slider', {
        loop: true,
        speed: SPEED,
        slidesPerView: 1,
        slidesPerGroup: 1,   // 버튼·키보드·자동 넘김 모두 한 장씩 (넘기는 중에 또 누르면 무시 → 건너뛰지 않음)
        autoplay: { delay: DELAY, disableOnInteraction: false },
        keyboard: { enabled: true },
        navigation: {
            prevEl: '.hero .swiper-button-prev',
            nextEl: '.hero .swiper-button-next',
        },
        pagination: {
            el: '.hero .swiper-pagination',
            type: 'fraction',
            formatFractionCurrent: (n) => String(n).padStart(2, '0'),
            formatFractionTotal: (n) => String(n).padStart(2, '0'),
            renderFraction: (currentClass, totalClass) => `<span class="current ${currentClass}"></span><span class="total"> / <span class="${totalClass}"></span></span>`,
        },
        a11y: {
            prevSlideMessage: '이전 룩',
            nextSlideMessage: '다음 룩',
            slideLabelMessage: '{{index}} / {{slidesLength}}',
        },
    });

    // 키보드로 히어로 안을 돌아다니는 동안은 자동 넘김을 멈춤 (마우스 클릭은 그대로 진행)
    hero.addEventListener('focusin', (e) => {
        if (e.target.matches(':focus-visible')) heroSwiper.autoplay.stop();
    });

    hero.addEventListener('focusout', (e) => {
        if (!hero.contains(e.relatedTarget)) heroSwiper.autoplay.start();
    });
}

/* ── 랭킹 Swiper ── */
const RANKING_PER_VIEW = 5;   // 한 화면에 보이는 상품 수 (시안: 308 × 5 + 사이 20 × 4 = 1620)
const RANKING_GAP = `${20 / 1620 * 100}%`;   // 상품 사이 20을 목록 폭에 대한 비율로 → 화면이 좁아지면 --px처럼 같이 줄어듦

if (window.Swiper && document.querySelector('.ranking-slider')) {
    new Swiper('.ranking-slider', {
        loop: true,   // 시안 첫 화면에도 이전 버튼이 있어서 처음·끝 없이 이어지게 둠
        slidesPerView: RANKING_PER_VIEW,
        slidesPerGroup: 1,   // 버튼 한 번에 한 칸씩
        spaceBetween: RANKING_GAP,
        navigation: {
            prevEl: '.ranking .swiper-button-prev',
            nextEl: '.ranking .swiper-button-next',
        },
        a11y: {
            prevSlideMessage: '이전 상품',
            nextSlideMessage: '다음 상품',
            slideLabelMessage: '{{index}} / {{slidesLength}}',
        },
    });
}

/* ── 추천 코디 Swiper (클래스는 예전 이름 그대로 country-look · look-slider) ── */
// 시안에 화살표·쪽 번호가 없어서 자동 넘김 + 끌어 넘기기 + 키보드 화살표로 3장을 돌림 (동작 줄이기여도 넘김 그대로 — 주인님 지정)
const LOOK_SPEED = 1000;   // 넘김 1s
const LOOK_DELAY = 5000;   // 자동 넘김 간격: 설명 두 줄을 읽을 시간

if (window.Swiper && document.querySelector('.look-slider')) {
    const countryLook = document.querySelector('.country-look');
    const lookSwiper = new Swiper('.look-slider', {
        loop: true,
        speed: LOOK_SPEED,
        slidesPerView: 1,
        grabCursor: true,   // 마우스로 끌어 넘길 수 있다는 걸 손 모양으로 알림
        lazyPreloadPrevNext: 1,   // 이웃한 장의 lazy 이미지를 미리 받아 넘기는 순간 빈 칸이 보이지 않게
        autoplay: { delay: LOOK_DELAY, disableOnInteraction: false, pauseOnMouseEnter: true },
        keyboard: { enabled: true },
        a11y: {
            slideLabelMessage: '{{index}} / {{slidesLength}}',
        },
    });

    // 키보드로 섹션 안을 돌아다니는 동안은 자동 넘김을 멈춤 (히어로와 같은 방식)
    countryLook.addEventListener('focusin', (e) => {
        if (e.target.matches(':focus-visible')) lookSwiper.autoplay.stop();
    });

    countryLook.addEventListener('focusout', (e) => {
        if (!countryLook.contains(e.relatedTarget)) lookSwiper.autoplay.start();
    });
}

/* ── 프로모션: 상품 두 줄이 왼쪽으로 계속 흐름 (움직임은 style.css) ── */
// 줄마다 13장을 복제해 뒤에 붙여 이음매 없이 돌게 함 (복제는 스크린리더에서 숨김)
// 화면에 보일 때만 흐르게 해서 안 보일 땐 그리기를 쉼 (발열 줄이기), 다시 보이면 시안과 같은 첫 모습부터
const promotionList = document.querySelector('.promotion-list');

if (promotionList) {
    const promotionRows = promotionList.querySelectorAll('.promotion-row');

    promotionRows.forEach((row) => {
        [...row.children].forEach((item) => {
            const copy = item.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            row.append(copy);
        });
    });

    new IntersectionObserver(([entry]) => {
        promotionRows.forEach((row) => row.classList.toggle('active', entry.isIntersecting));
    }).observe(promotionList);
}

/* ── 여자 코트 상품 Swiper (women-coat.html, 섹션 4개가 같은 설정) ── */
const COAT_PER_VIEW = 4;   // 한 화면에 카드 4장 (양옆 25씩 보이는 카드는 style.css의 overflow: visible)
const COAT_VIEW = 1690;   // 슬라이더 폭(시안 px) = 카드 400 × 4 + 간격 30 × 3
const COAT_GAP = 30;   // 카드 간격(시안 px), 화면 폭에 맞춰 같이 줄도록 슬라이더 폭의 %로 넘김
const COAT_FIRST = 3;   // 처음 보이는 카드 = 4번째 (시안 목록이 가운데 정렬이라 1~3번째는 왼쪽에 있음)

if (window.Swiper && document.querySelector('.coat-slider')) {
    document.querySelectorAll('.coat-swiper').forEach((box) => {
        new Swiper(box.querySelector('.coat-slider'), {
            loop: true,
            loopAdditionalSlides: 1,   // 넘기는 중에도 양옆 25 자리에 카드가 비지 않게 한 장 더 붙여 둠
            slidesPerView: COAT_PER_VIEW,
            spaceBetween: `${COAT_GAP / COAT_VIEW * 100}%`,
            initialSlide: COAT_FIRST,
            navigation: {
                prevEl: box.querySelector('.swiper-button-prev'),
                nextEl: box.querySelector('.swiper-button-next'),
            },
            a11y: {
                prevSlideMessage: '이전 상품',
                nextSlideMessage: '다음 상품',
                slideLabelMessage: '{{index}} / {{slidesLength}}',
            },
        });
    });
}

/* ── 여자 코트 상품 상세 창 (women-coat.html, 롱코트 01 카드) ── */
// 카드 링크가 #detail-long-coat-01이라 JS가 없어도 :target으로 열림 (style.css) → JS가 있으면 누를 때 열고, 주소 해시 · 뒤로 가기와 맞춤
// 열면 창 안으로 포커스를 옮기고 Tab이 창 안에서만 돎, 뒤 페이지(헤더 · 본문)는 inert + 스크롤 막음(style.css의 :has)
// 닫기(닫기 버튼 · Esc · 뒤로 가기, 창 밖 어두운 곳을 눌러도 닫히지 않음 — 주인님 지정)는 주소 해시를 지우고 연 카드로 포커스를 돌려줌: 카드를 눌러 남긴 기록은 뒤로 가기로 되돌리고, 해시를 달고 들어온 주소는 replaceState로 지움
const detail = document.querySelector('.detail-dim');

if (detail) {
    const panel = detail.querySelector('.product-detail');
    const hash = `#${panel.id}`;   // id는 창에 둠 → 주소로 열 때 브라우저도 창에 포커스를 줌
    const cardLinks = document.querySelectorAll(`a[href="${hash}"]`);
    const pageParts = document.querySelectorAll('body > header, body > main');
    const FOCUSABLE = 'a[href], button:not(:disabled), iframe, [tabindex="0"]';   // 창 안에서 Tab이 멈추는 곳 (iframe = 피팅룸)
    let opener = null;   // 닫을 때 포커스를 돌려줄 카드 링크

    detail.classList.add('ready');   // 이제 해시가 아니라 JS가 여닫음 (style.css의 :target은 JS가 없을 때만)

    /* 피팅룸: 창 오른쪽 끝 '<' 칸(시안 341:2229)을 누르면 창 오른쪽 끝에서 밀려 들어와 그 칸을 덮음 (시안 프로토타입 오버레이, 다른 페이지로 가지 않고 주소 기록도 남기지 않음)
       내용은 fitting-room.html?embed=1 하나를 처음 열 때 iframe으로 넣고, 닫으면 다 나간 뒤 새로 읽어 둠 → 다시 열면 처음부터 (몸 정보는 갈매기표, 옷 · 사이즈는 처음 값 — 주인님 요청 '다시 새로 리스타트 되면 다시 처음으로')
       열려 있는 동안 피팅룸에 가려진 정보 · 닫기만 inert, 사진(갤러리)은 그대로 → 피팅룸 코디와 모델 코디를 나란히 비교 (주인님 요청): 휠로 넘기기 · 썸네일 · Tab은 사진 칸 · 썸네일 ↔ 피팅룸
       사진을 눌러도 피팅룸은 닫히지 않음 (시안 오버레이 설정, 피팅룸 안에 열린 목록 · 옷 칸은 fitting-room.js가 닫음)
       닫기: 피팅룸의 닫기 · Esc(피팅룸 안 → fitting-room.js가 알림, 창 쪽 → 여기) → '<' 칸으로 포커스, 상세 창을 닫으면 같이 닫힘
       포커스가 iframe 경계를 넘을 때는 키보드로 했는지를 직접 넘김(focusVisible) → 브라우저가 문서마다 마지막 입력(마우스 · 키보드)을 따로 기억해서, 마우스를 쓴 문서로 키보드 포커스가 넘어가면 테두리가 안 그려지는 일이 없게 */
    const fittingLink = panel.querySelector('.btn-fitting-room');
    const fitting = panel.querySelector('.fitting-popup');
    const gallery = panel.querySelector('.detail-gallery');
    const coveredParts = [...panel.children].filter((part) => part !== fitting && part !== gallery);   // 피팅룸이 열리면 inert (정보 · 닫기)
    const FITTING_SRC = `${fittingLink.getAttribute('href')}?embed=1`;   // 링크(JS가 없을 때 가는 피팅룸 페이지)와 같은 파일
    const FITTING_MOVE = 300;   // 밀려 나가는 시간 (ms, style.css .fitting-sheet 0.3s)
    let fittingFrame = null;   // 처음 열 때 만듦
    let fittingByKey = false;   // 키보드(Enter)로 열었는지
    let fittingReset = 0;   // 닫은 뒤 새로 읽기 타이머

    fitting.inert = true;   // 닫힌 피팅룸에는 Tab이 들어가지 않게

    // 피팅룸 안으로 포커스 → 스크린리더는 피팅룸 안부터 읽음
    // 키보드로 열면 첫 칸(성별)으로 바로 가서 고르고, 마우스로 열면 피팅룸 문서에만 둠 (새 iframe에서는 첫 칸에 포커스 테두리가 그려져 시안과 달라짐, Tab 한 번이면 성별)
    function focusFitting() {
        const doc = fittingFrame.contentDocument;
        const first = doc && doc.querySelector(FOCUSABLE);
        if (fittingByKey && first) {
            first.focus({ focusVisible: true });   // 피팅룸 문서에서 마지막으로 쓴 게 마우스여도 테두리를 그림
            return;
        }
        if (doc && doc.activeElement) doc.activeElement.blur();   // 다시 열 때 지난번에 누른 곳(닫기 등)이 아니라 처음부터
        fittingFrame.focus();
    }

    // 피팅룸 칸이 준비되면 내용을 보여 주고(style.css .ready), 그사이 열려 있으면 피팅룸 안으로 포커스 (받는 사이 사진 칸으로 옮겨 갔으면 그대로 둠)
    // fitting-room.js의 준비 알림(HTML을 다 읽은 때)이 먼저 오고, load(사진까지 다 받은 때)는 스크립트를 못 받았을 때를 위한 대비
    function frameReady() {
        if (fittingFrame.classList.contains('ready')) return;
        fittingFrame.classList.add('ready');
        if (fitting.classList.contains('active') && document.activeElement === panel) focusFitting();
    }

    // 닫힌 피팅룸을 새로 읽음 → 다시 열면 처음부터 (몸 정보 · 옷 · 사이즈 모두 페이지를 처음 연 때와 같음)
    // 다 나간 뒤에 읽어서 나가는 동안 내용이 비지 않게, 그 사이 다시 열었으면 그대로 둠
    // location.replace → 기록이 남지 않아 브라우저 뒤로 가기가 iframe 안에서 멈추지 않음, 읽는 동안은 숨기고 준비되면 다시 보임 (frameReady)
    function resetFitting() {
        if (!fittingFrame || fitting.classList.contains('active')) return;
        fittingFrame.classList.remove('ready');
        fittingFrame.contentWindow.location.replace(FITTING_SRC);
    }

    function openFitting(byKey) {
        if (fitting.classList.contains('active')) return;
        clearTimeout(fittingReset);
        fittingByKey = byKey;
        if (!fittingFrame) {
            fittingFrame = document.createElement('iframe');
            fittingFrame.className = 'fitting-frame';
            fittingFrame.title = '피팅룸';
            fittingFrame.src = FITTING_SRC;
            fittingFrame.addEventListener('load', frameReady);
            fitting.querySelector('.fitting-sheet').append(fittingFrame);   // 밀려 들어오는 판 안에 (자르는 자리는 그대로 — style.css)
        }
        fitting.classList.add('active');
        fitting.inert = false;
        coveredParts.forEach((part) => { part.inert = true; });
        if (fittingFrame.classList.contains('ready')) focusFitting();
        else panel.focus();   // 받는 동안은 창에 포커스를 둠 → 누른 링크가 inert가 되며 포커스가 창 밖 페이지로 빠지지 않게 (받는 동안 Tab은 사진 칸 · 썸네일만 돎 — 아래 keydown)
    }

    function closeFitting(focusLink, byKey) {
        if (!fitting.classList.contains('active')) return;
        fitting.classList.remove('active');
        fitting.inert = true;
        coveredParts.forEach((part) => { part.inert = false; });
        if (focusLink) fittingLink.focus({ focusVisible: byKey });   // 키보드로 닫았을 때만 테두리 (마우스로 닫으면 없음)
        clearTimeout(fittingReset);
        fittingReset = setTimeout(resetFitting, FITTING_MOVE);
    }

    // 창 안에서 Tab이 멈추는 곳 (가려진 칸은 inert라 빠짐): 피팅룸이 열리면 사진 칸 · 썸네일 · 피팅룸 iframe(받는 동안은 숨어 있어서 빼고), 닫히면 iframe 빼고 전부
    // 접힌 썸네일 줄은 고른 칸만(고르지 않은 칸은 tabindex -1 — 아래 markExpanded) → 피팅룸에서 Shift+Tab으로 나올 때 숨은 칸(마지막 줄의 고르지 않은 칸)에 포커스를 주다 멈추지 않게
    function tabItems() {
        return [...panel.querySelectorAll(FOCUSABLE)].filter((item) => !item.closest('[inert]') && !item.matches('[tabindex="-1"]') && (item !== fittingFrame || item.classList.contains('ready')));
    }

    // 피팅룸 첫 칸에서 Shift+Tab · 마지막 칸에서 Tab → 피팅룸 앞 · 뒤 칸(썸네일 · 사진 칸)으로 (피팅룸 안 Tab은 이 페이지로 오지 않아서 fitting-room.js가 알림)
    function tabOutOfFitting(back) {
        if (!fitting.classList.contains('active')) return;
        const items = tabItems();
        const at = items.indexOf(fittingFrame);
        items[(at + (back ? -1 : 1) + items.length) % items.length].focus({ focusVisible: true });   // 키보드로 넘어왔으니 테두리를 그림
    }

    fittingLink.addEventListener('click', (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // 새 탭으로 열기(⌘ · Ctrl 클릭)는 그대로 피팅룸 페이지
        e.preventDefault();
        openFitting(e.detail === 0);   // 키보드 Enter로 누른 클릭은 detail 0
    });

    // 피팅룸 iframe이 보낸 '준비' · '닫기' · 'Tab으로 나가기'만 받음 (같은 사이트 · 지금 띄운 iframe인지 확인)
    window.addEventListener('message', (e) => {
        if (e.origin !== location.origin || !fittingFrame || e.source !== fittingFrame.contentWindow || !e.data) return;
        if (e.data.type === 'menkhet-fitting-ready') frameReady();
        else if (e.data.type === 'menkhet-fitting-close') closeFitting(true, e.data.byKey === true);
        else if (e.data.type === 'menkhet-fitting-tab') tabOutOfFitting(e.data.back === true);
    });

    function openDetail(link = cardLinks[0]) {
        if (detail.classList.contains('active')) return;
        opener = link;
        detail.classList.add('active');
        pageParts.forEach((part) => { part.inert = true; });
        panel.focus();
    }

    function closeDetail() {
        if (!detail.classList.contains('active')) return;
        detail.classList.remove('active');
        closeFitting(false);   // 피팅룸이 열려 있었으면 같이 닫음 (포커스는 아래에서 카드로)
        closeRow(false);   // 펼친 썸네일 줄 · 컬러 · 사이즈 목록도 접어 둠 → 다시 열면 처음처럼 접힌 모습 (고른 컬러 · 사이즈는 그대로)
        closeOption(false);
        pageParts.forEach((part) => { part.inert = false; });
        if (location.hash === hash) {
            // 카드를 눌러 남긴 기록(state 표시)은 뒤로 가기로 지움 → 여닫을 때마다 같은 주소 기록이 쌓여 뒤로 가기를 여러 번 눌러야 떠나는 일이 없게 (뒤따르는 popstate는 이미 닫혀서 그냥 지나감)
            // 해시를 달고 들어온 주소는 앞 기록이 다른 사이트일 수 있어 주소만 바꿈
            if (history.state && history.state.detail) history.back();
            else history.replaceState(null, '', location.pathname + location.search);
        }
        if (opener) focusOpener();
    }

    // 연 카드로 포커스를 돌려줌: 카드가 이미 다 보이면 Swiper 접근성 동작(포커스 받은 카드를 맨 앞으로 옮김)을 잠깐 꺼서 닫을 때 슬라이더가 한 칸 튀지 않게
    // (해시로 바로 열어서 카드가 화면 밖이면 그대로 둬서 Swiper가 카드를 보이게 옮김)
    function focusOpener() {
        const slider = opener.closest('.swiper');
        const box = opener.closest('.coat-swiper');
        const a11y = slider && slider.swiper ? slider.swiper.params.a11y : null;
        const card = opener.getBoundingClientRect();
        const view = box ? box.getBoundingClientRect() : null;
        const shown = view && card.left >= view.left && card.right <= view.right;
        const scrollOnFocus = a11y ? a11y.scrollOnFocus : false;
        if (a11y && shown) a11y.scrollOnFocus = false;
        opener.focus();
        if (a11y) a11y.scrollOnFocus = scrollOnFocus;
    }

    cardLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            // 끌어 넘긴 뒤의 클릭(Swiper가 막음) · 새 탭으로 열기(⌘ · Ctrl 클릭)는 그대로 둠
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            history.pushState({ detail: true }, '', hash);   // 뒤로 가기로 닫히게 주소 기록을 하나 남김 (state 표시 = 이 카드가 남긴 기록)
            openDetail(link);
        });
    });

    // 뒤로 · 앞으로 가기나 주소 해시가 바뀌면 창을 해시에 맞춤
    function syncDetail() {
        if (location.hash === hash) openDetail();
        else closeDetail();
    }

    window.addEventListener('popstate', syncDetail);
    window.addEventListener('hashchange', syncDetail);

    detail.querySelector('.btn-close').addEventListener('click', closeDetail);

    // Esc로 닫고(펼친 목록 · 썸네일 줄 → 피팅룸 → 상세 창 순서로 하나씩), Tab은 창 안 마지막 → 처음(Shift+Tab은 반대)으로 돌림
    // 컬러 · 사이즈 목록이 열려 있으면 ↑/↓로 줄을 옮겨 다님 (피팅룸 몸 정보 목록과 같음)
    // 포커스가 피팅룸 iframe 안에 있을 땐 키가 이 페이지로 오지 않음 → Esc · Tab은 fitting-room.js가 맡고, 피팅룸 끝에서 Tab을 넘기면 위 tabOutOfFitting
    document.addEventListener('keydown', (e) => {
        if (!detail.classList.contains('active')) return;
        if (e.key === 'Escape') {
            if (openSelect) closeOption(true);   // 접고 그 칸으로 포커스
            else if (openItem) closeRow(true);   // 접고 그 줄의 고른 칸으로 포커스
            else if (fitting.classList.contains('active')) closeFitting(true, true);
            else closeDetail();
            return;
        }
        if (openSelect && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            const options = [...openSelect.querySelectorAll('.option')];
            if (!options.length) return;   // 컬러를 고르기 전 사이즈 목록(안내 한 줄)
            e.preventDefault();   // 사진 칸이 스크롤되지 않게
            const down = e.key === 'ArrowDown';
            const now = options.indexOf(document.activeElement);
            const next = now === -1 ? (down ? 0 : options.length - 1) : (now + (down ? 1 : -1) + options.length) % options.length;
            options[next].focus();
            return;
        }
        if (e.key !== 'Tab') return;
        const items = tabItems();   // 피팅룸을 받는 동안은 사진 칸 · 썸네일만 돎
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
            e.preventDefault();
            // 마지막이 피팅룸이면 iframe 문서가 아니라 그 안의 마지막 칸(피팅룸 닫기)으로 바로 감
            const lastInFrame = last === fittingFrame ? fittingFrame.contentDocument.querySelector('.btn-close') : null;
            (lastInFrame || last).focus({ focusVisible: true });
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus({ focusVisible: true });
        }
    });

    /* 사진 고르기: 컬러 칸 · 썸네일에서 고르면 그 사진으로 바로 옮김(부드러운 스크롤 없이)
       사진마다 data-color(코트 색) · 모델 사진은 data-look(모델 차림 = 모델이 입은 코트 색: black · brown)
       썸네일은 피팅룸 옷 칸(fitting-room.js)과 같은 방식: 접힌 줄에는 고른 칸 하나만 보이고, 누르면 펼침 → 다른 칸을 고르면 옮기고 접음 (고른 칸을 다시 누르면 접기만)
         · 코트 줄 → 그 색의 첫 사진 (검정 → 모델 검정 1, 아이보리 → 아이보리 상품 사진, 브라운 → 모델 브라운 1)
         · 모델 착용 줄(셔츠 · 바지 · 로퍼) → 그 옷을 입은 차림의 첫 모델 사진, 세 줄 · 코트 줄이 모두 그 차림으로
       한 번에 한 줄만 열림: 바깥을 누르거나 다른 곳으로 포커스가 가면 닫힘, Esc → 닫고 그 줄의 고른 칸으로 포커스 (위 keydown)
       넘겨 보면 가운데 사진에 맞춰 코트 줄 · 모델 착용 줄만 바뀜 (컬러 칸은 직접 고를 때만 — 아래 옵션 고르기) */
    const track = detail.querySelector('.gallery-track');
    const shots = [...track.querySelectorAll('img')];
    const coatRow = gallery.querySelector('.side-item[data-part="coat"]');
    const wearRows = [...gallery.querySelectorAll('.model-wear .side-item')];   // 셔츠 · 바지 · 로퍼
    let openItem = null;   // 펼친 썸네일 줄
    let seenShot = shots[0];   // 썸네일이 맞춰 둔 사진 (넘기는 동안 같은 사진이면 다시 맞추지 않음)

    // 줄을 여닫는 건 고른 칸 버튼 하나 → aria-expanded는 그 버튼에만 (fitting-room.js와 같음)
    // 접힌 줄의 고르지 않은 칸은 Tab에서 바로 뺌 (style.css visibility는 0.3s 접힌 뒤에야 숨어서, 그 사이 Tab이 숨는 칸에 멈추지 않게)
    function markExpanded(item, open) {
        item.querySelectorAll('.side-option').forEach((button) => {
            const chosen = button.getAttribute('aria-pressed') === 'true';
            if (chosen) button.setAttribute('aria-expanded', String(open));
            else button.removeAttribute('aria-expanded');
            if (chosen || open) button.removeAttribute('tabindex');
            else button.tabIndex = -1;
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

    // 줄에 보일 칸을 바꿈: aria-pressed · 접혔을 때 보일 칸 --index (펼친 줄이면 aria-expanded도 새로 고른 칸으로)
    // 접힌 줄에서 포커스가 있던 칸이 숨게 되면 새로 고른 칸으로 포커스를 옮김 → 넘겨 보다 줄이 바뀌어도 포커스가 body로 빠지지 않게 (키보드로 왔으면 테두리도 그대로)
    function pick(item, option) {
        const options = [...item.querySelectorAll('.side-option')];
        const focused = document.activeElement;
        const hiding = item !== openItem && focused !== option && options.includes(focused);
        options.forEach((button) => button.setAttribute('aria-pressed', String(button === option)));
        item.style.setProperty('--index', options.indexOf(option));
        markExpanded(item, item === openItem);
        if (hiding) option.focus({ preventScroll: true, focusVisible: focused.matches(':focus-visible') });
    }

    // 사진 한 장 → 썸네일: 코트 줄은 사진의 코트 색, 모델 착용 줄은 사진의 차림 (모델 사진이 아니면 코트 색과 같은 차림, 아이보리처럼 없으면 그대로)
    function matchThumbs(shot) {
        seenShot = shot;
        pick(coatRow, coatRow.querySelector(`.side-option[data-color="${shot.dataset.color}"]`));
        const look = shot.dataset.look || shot.dataset.color;
        wearRows.forEach((item) => {
            const option = item.querySelector(`.side-option[data-look="${look}"]`);
            if (option) pick(item, option);
        });
    }

    // 고른 사진으로 옮기고 썸네일을 그 사진에 맞춤
    function showShot(shot) {
        track.scrollTop = shot.offsetTop;
        matchThumbs(shot);
    }

    const firstShot = (key, value) => shots.find((shot) => shot.dataset[key] === value);

    [coatRow, ...wearRows].forEach((item) => {
        markExpanded(item, false);   // 처음부터 접힌 줄의 고르지 않은 칸은 Tab에서 뺌
        item.addEventListener('click', (e) => {
            const option = e.target.closest('.side-option');
            if (!option) return;
            if (openItem !== item) {
                openRow(item);
                return;
            }
            if (option.getAttribute('aria-pressed') !== 'true') showShot(option.dataset.look ? firstShot('look', option.dataset.look) : firstShot('color', option.dataset.color));
            closeRow(false);
        });
    });

    // 갤러리 가운데 높이에 걸친 사진 = 지금 보는 사진 → 썸네일만 맞춤 (고른 컬러는 그대로 둠)
    track.addEventListener('scroll', () => {
        const middle = track.scrollTop + track.clientHeight / 2;
        const shot = shots.findLast((item) => item.offsetTop <= middle);
        if (shot !== seenShot) matchThumbs(shot);
    }, { passive: true });

    /* 옵션 고르기: 컬러 · 사이즈 칸 (시안 Component 1 · 2) — 칸을 누르면 아래로 목록이 0.3s 등속으로 펼쳐짐(style.css), 한 번에 하나만 열림
       컬러를 고르면 칸에 그 색 이름이 나오고 그 색의 첫 사진으로 옮김 (사진 · 썸네일을 넘겨 봐도 고른 컬러는 그대로 — 사려고 고른 값이 사진을 볼 때마다 바뀌지 않게)
       사이즈 목록은 고른 컬러의 S · M · L · XL ('블랙 S' — 시안은 블랙만 만들어 둠, 브라운 · 아이보리도 같은 꼴로 · 주인님 지정), 컬러를 고르기 전엔 '컬러를 먼저 선택해주세요' 한 줄
       다른 컬러로 바꾸면 고른 사이즈는 비움 (색마다 목록이 달라서), 장바구니가 연결되면 고른 컬러 · 사이즈를 같이 보냄
       열면 고른 줄(없으면 첫 줄 · 안내 줄)로 포커스 → ↑/↓로 옮겨 다니고(위 keydown), 고르면 접고 칸으로 포커스, 바깥을 누르거나 다른 곳으로 포커스가 가면 접음 (fitting-room.js 몸 정보 칸과 같음) */
    const SIZE_COLOR_NAMES = { black: '블랙', brown: '브라운', ivory: '아이보리' };   // 사이즈 목록의 색 이름 (시안 '블랙 S', 컬러 목록은 검정 · 브라운 · 아이보리)
    const SIZES = ['S', 'M', 'L', 'XL'];
    const SELECT_NAMES = { color: '컬러', size: '사이즈' };   // 고른 뒤 스크린리더가 '컬러 검정'처럼 칸 이름과 같이 읽게
    const selects = [...detail.querySelectorAll('.option-select')];
    const sizeSelect = detail.querySelector('.option-select[data-option="size"]');
    const sizeList = sizeSelect.querySelector('.option-list');
    const placeholders = new Map(selects.map((select) => [select, select.querySelector('.value').textContent]));   // '컬러 선택' · '사이즈 선택'
    let openSelect = null;   // 펼친 옵션 칸

    // 칸 글자를 고른 값으로 (없으면 처음 글자로 돌아감)
    function showValue(select, text) {
        const toggle = select.querySelector('.toggle');
        toggle.querySelector('.value').textContent = text || placeholders.get(select);
        if (text) toggle.setAttribute('aria-label', `${SELECT_NAMES[select.dataset.option]} ${text}`);
        else toggle.removeAttribute('aria-label');
    }

    // 사이즈 줄 하나: 값 버튼 (고른 줄은 aria-pressed="true", fitting-room.js optionItem과 같은 꼴)
    function sizeItem(color, size) {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option';
        button.dataset.size = size;
        button.setAttribute('aria-pressed', 'false');
        button.textContent = `${SIZE_COLOR_NAMES[color]} ${size}`;
        li.append(button);
        return li;
    }

    // 닫는 목록은 접히는 0.3s 동안에도 보이므로 inert → 그 사이 누르거나 Tab으로 들어가지 않게
    function closeOption(focusToggle) {
        if (!openSelect) return;
        const select = openSelect;
        const toggle = select.querySelector('.toggle');
        const list = select.querySelector('.option-list');
        openSelect = null;
        list.hidden = true;
        list.inert = true;
        toggle.setAttribute('aria-expanded', 'false');
        if (focusToggle) toggle.focus();
    }

    function openOption(select) {
        closeOption(false);
        const list = select.querySelector('.option-list');
        openSelect = select;
        list.hidden = false;
        list.inert = false;
        select.querySelector('.toggle').setAttribute('aria-expanded', 'true');
        (list.querySelector('[aria-pressed="true"]') || list.querySelector('.option, .hint')).focus();
    }

    // 컬러: 같은 색을 다시 골라도 그 색 사진으로는 옮김 (사이즈는 그대로), 다른 색이면 사이즈를 비우고 사이즈 목록을 그 색으로
    function chooseColor(option) {
        const color = option.dataset.color;
        if (option.getAttribute('aria-pressed') !== 'true') {
            option.closest('.option-list').querySelectorAll('.option').forEach((button) => button.setAttribute('aria-pressed', String(button === option)));
            showValue(option.closest('.option-select'), option.textContent);
            showValue(sizeSelect, '');
            sizeList.replaceChildren(...SIZES.map((size) => sizeItem(color, size)));
        }
        showShot(firstShot('color', color));
    }

    function chooseSize(option) {
        sizeList.querySelectorAll('.option').forEach((button) => button.setAttribute('aria-pressed', String(button === option)));
        showValue(sizeSelect, option.textContent);
    }

    // 칸을 누르면 여닫고, 목록 안은 줄 고르기 (사이즈 줄은 다시 만들어지므로 칸에 한 번만 걸어 둠)
    selects.forEach((select) => {
        select.addEventListener('click', (e) => {
            if (e.target.closest('.toggle')) {
                if (openSelect === select) closeOption(false);
                else openOption(select);
                return;
            }
            const option = e.target.closest('.option');
            if (!option) return;
            if (select.dataset.option === 'color') chooseColor(option);
            else chooseSize(option);
            closeOption(true);
        });
    });

    // 바깥을 누르면 펼친 썸네일 줄 · 옵션 목록을 접음
    document.addEventListener('click', (e) => {
        if (openItem && !openItem.contains(e.target)) closeRow(false);
        if (openSelect && !openSelect.contains(e.target)) closeOption(false);
    });

    // Tab으로 줄 · 칸 밖에 포커스가 가도 접음 (버튼을 누를 때 포커스가 버튼으로 가지 않는 브라우저가 있어서 focusout 대신 focusin으로 봄 — fitting-room.js와 같음)
    // Safari · 맥 Firefox는 버튼을 누르면 버튼 대신 가장 가까운 포커스 가능한 조상(tabindex -1인 창)에 포커스를 줌 → 창으로 온 포커스는 바깥으로 보지 않음
    // (그러지 않으면 목록 줄을 누르는 순간 목록이 먼저 접혀 고를 수 없음, 바깥 누르기는 위 click이 접음 · Tab은 창에 멈추지 않음)
    document.addEventListener('focusin', (e) => {
        if (e.target === panel) return;
        if (openItem && !openItem.contains(e.target)) closeRow(false);
        if (openSelect && !openSelect.contains(e.target)) closeOption(false);
    });

    // 피팅룸 iframe 안을 누르면 클릭 · 포커스가 이 페이지로 오지 않음 → 창(window)에서 포커스가 빠질 때 썸네일 줄을 접음
    // 옵션 목록은 그대로 둠: 피팅룸이 열려 있는 동안 정보 칸은 inert라 목록이 열려 있을 수 없고, 앱 · 탭을 바꿀 때 접으면 목록 안 포커스가 body로 빠짐
    window.addEventListener('blur', () => closeRow(false));

    if (location.hash === hash) openDetail();   // 해시를 달고 들어오면 바로 열림 (주소 공유)
}
