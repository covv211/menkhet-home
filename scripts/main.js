/* ══════════ MENKHET 메인 ══════════
   - index.html · women-coat.html이 같이 씀 → 페이지에 없는 요소는 건너뜀
   - 헤더 전체 메뉴(.sub): 햄버거 → 1차 → 2차 → 3차 메뉴, 단계마다 하나만 열림 (0.3s 왼쪽→오른쪽 펼침 · 밑줄은 style.css)
   - 검색: 결과 페이지가 정해지기 전이라 제출만 막음
   - 히어로 Swiper: 한 장씩 옆으로 1.5s 등속, 자동 넘김 (동작 줄이기여도 넘김 그대로 — 주인님 지정)
   - 랭킹 · 나라별 룩 · 여자 코트 Swiper, 프로모션 두 줄 흐름
   - 여자 코트 상품 상세 창: 롱코트 01 카드를 누르면 열림 (주소 해시 · 뒤로 가기와 맞춤, 0.3s 페이드는 style.css) */

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

/* ── 나라별 룩 Swiper ── */
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
// 닫기(닫기 버튼 · Esc · 창 밖 어두운 곳)는 주소 해시를 지우고 연 카드로 포커스를 돌려줌: 카드를 눌러 남긴 기록은 뒤로 가기로 되돌리고, 해시를 달고 들어온 주소는 replaceState로 지움
const detail = document.querySelector('.detail-dim');

if (detail) {
    const panel = detail.querySelector('.product-detail');
    const hash = `#${panel.id}`;   // id는 창에 둠 → 주소로 열 때 브라우저도 창에 포커스를 줌
    const cardLinks = document.querySelectorAll(`a[href="${hash}"]`);
    const pageParts = document.querySelectorAll('body > header, body > main');
    const FOCUSABLE = 'a[href], button:not(:disabled), [tabindex="0"]';   // 창 안에서 Tab이 멈추는 곳
    let opener = null;   // 닫을 때 포커스를 돌려줄 카드 링크
    let downOnDim = false;

    detail.classList.add('ready');   // 이제 해시가 아니라 JS가 여닫음 (style.css의 :target은 JS가 없을 때만)

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

    // 창 밖 어두운 곳을 누르면 닫음 (창 안에서 누른 채 끌고 나와 뗀 건 빼고)
    detail.addEventListener('pointerdown', (e) => {
        downOnDim = e.target === detail;
    });

    detail.addEventListener('click', (e) => {
        if (e.target === detail && downOnDim) closeDetail();
    });

    // Esc로 닫고, Tab은 창 안 마지막 → 처음(Shift+Tab은 반대)으로 돌림
    document.addEventListener('keydown', (e) => {
        if (!detail.classList.contains('active')) return;
        if (e.key === 'Escape') {
            closeDetail();
            return;
        }
        if (e.key !== 'Tab') return;
        const items = panel.querySelectorAll(FOCUSABLE);
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    /* 사진 고르기: 컬러 칸 · 썸네일을 누르면 그 컬러 사진으로 바로 옮김(부드러운 스크롤 없이), 넘겨 보면 보이는 사진의 썸네일이 진해짐 */
    const track = detail.querySelector('.gallery-track');
    const shots = [...track.querySelectorAll('img')];
    const thumbs = detail.querySelectorAll('.gallery-thumb');
    const colorChips = detail.querySelectorAll('.color-chip');
    const sizeChips = detail.querySelectorAll('.size-chip');

    function markThumb(color) {
        thumbs.forEach((thumb) => thumb.setAttribute('aria-current', String(thumb.dataset.color === color)));
    }

    function showColor(color) {
        colorChips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.color === color)));
        track.scrollTop = shots.find((shot) => shot.dataset.color === color).offsetTop;
        markThumb(color);
    }

    colorChips.forEach((chip) => {
        chip.addEventListener('click', () => showColor(chip.dataset.color));
    });

    thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => showColor(thumb.dataset.color));
    });

    // 갤러리 가운데 높이에 걸친 사진 = 지금 보는 사진 (컬러 선택은 그대로 둠)
    track.addEventListener('scroll', () => {
        const middle = track.scrollTop + track.clientHeight / 2;
        markThumb(shots.findLast((shot) => shot.offsetTop <= middle).dataset.color);
    }, { passive: true });

    // 사이즈는 하나만 고름 (장바구니가 연결되면 고른 값을 같이 보냄)
    sizeChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            sizeChips.forEach((other) => other.setAttribute('aria-pressed', String(other === chip)));
        });
    });

    // 리뷰 목록은 마우스 휠로도 가로로 넘김 (스크롤 막대를 숨겨서 휠만으로는 셋째 카드 뒤를 볼 수 없음, 피팅룸 옷 목록과 같게)
    const reviewList = detail.querySelector('.review-list');

    reviewList.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        reviewList.scrollLeft += e.deltaY;
    }, { passive: false });

    if (location.hash === hash) openDetail();   // 해시를 달고 들어오면 바로 열림 (피팅룸에서 돌아올 때 · 주소 공유)
}
