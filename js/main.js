// Keep the page narrative in the intended order.
const heroSection = document.querySelector('#hero');
const orderedSections = ['#about', '#honors', '#experience', '#projects', '#campus', '#life']
    .map(selector => document.querySelector(selector))
    .filter(Boolean);

let sectionAnchor = heroSection;
orderedSections.forEach(section => {
    sectionAnchor?.insertAdjacentElement('afterend', section);
    sectionAnchor = section;
});

// ============================================
// Section views: browse all or open one module
// ============================================
const viewSections = {
    education: ['about', 'honors'],
    experience: ['experience'],
    projects: ['projects'],
    campus: ['campus'],
    life: ['life']
};

const requestedView = new URLSearchParams(window.location.search).get('view');
const activeView = Object.hasOwn(viewSections, requestedView) ? requestedView : 'all';

document.body.dataset.view = activeView;
document.body.classList.toggle('module-mode', activeView !== 'all');

if (activeView !== 'all') {
    const visibleSections = new Set(viewSections[activeView]);
    document.querySelectorAll('main > .section, body > .section').forEach(section => {
        section.hidden = !visibleSections.has(section.id);
    });
} else {
    document.body.classList.add('horizontal-view');

    const pageDefinitions = [
        { key: 'home', nodes: [heroSection] },
        { key: 'education', nodes: [document.querySelector('#about'), document.querySelector('#honors')] },
        { key: 'experience', nodes: [document.querySelector('#experience')] },
        { key: 'projects', nodes: [document.querySelector('#projects')] },
        { key: 'campus', nodes: [document.querySelector('#campus')] },
        { key: 'life', nodes: [document.querySelector('#life'), document.querySelector('.footer')] }
    ];

    const pageTrack = document.createElement('div');
    pageTrack.className = 'page-track';

    pageDefinitions.forEach(({ key, nodes }) => {
        const panel = document.createElement('div');
        panel.className = 'page-panel';
        panel.dataset.page = key;
        nodes.filter(Boolean).forEach(node => panel.appendChild(node));
        pageTrack.appendChild(panel);
    });

    const sectionPager = document.querySelector('.section-pager');
    sectionPager?.insertAdjacentElement('beforebegin', pageTrack);

    const panels = Array.from(pageTrack.querySelectorAll('.page-panel'));
    const pageCount = document.querySelector('.section-page-count');
    const previousPage = document.querySelector('.section-page-prev');
    const nextPage = document.querySelector('.section-page-next');
    let currentPage = 0;

    function updatePageControls(index) {
        currentPage = Math.max(0, Math.min(index, panels.length - 1));
        panels.forEach((panel, panelIndex) => {
            const state = panelIndex < currentPage
                ? 'past'
                : panelIndex > currentPage
                    ? 'future'
                    : 'active';
            panel.dataset.panelState = state;
            panel.setAttribute('aria-hidden', state === 'active' ? 'false' : 'true');
        });
        if (pageCount) {
            pageCount.textContent = `${String(currentPage + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
        }
        if (previousPage) previousPage.disabled = currentPage === 0;
        if (nextPage) nextPage.disabled = currentPage === panels.length - 1;
    }

    function goToPage(index, behavior = 'smooth') {
        const targetIndex = Math.max(0, Math.min(index, panels.length - 1));
        if (behavior === 'auto') {
            pageTrack.classList.add('page-track-no-transition');
        }
        updatePageControls(targetIndex);
        if (behavior === 'auto') {
            window.requestAnimationFrame(() => pageTrack.classList.remove('page-track-no-transition'));
        }
    }

    previousPage?.addEventListener('click', () => goToPage(currentPage - 1));
    nextPage?.addEventListener('click', () => goToPage(currentPage + 1));

    let horizontalWheelLocked = false;
    pageTrack.addEventListener('wheel', event => {
        if (Math.abs(event.deltaX) < 38 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        event.preventDefault();
        if (horizontalWheelLocked) return;
        horizontalWheelLocked = true;
        goToPage(currentPage + (event.deltaX > 0 ? 1 : -1));
        window.setTimeout(() => {
            horizontalWheelLocked = false;
        }, 620);
    }, { passive: false });

    let touchStartX = 0;
    let touchStartY = 0;
    pageTrack.addEventListener('touchstart', event => {
        const touch = event.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: true });
    pageTrack.addEventListener('touchend', event => {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        if (Math.abs(deltaX) > 64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
            goToPage(currentPage + (deltaX < 0 ? 1 : -1));
        }
    }, { passive: true });

    document.querySelectorAll('a[href*="view="]').forEach(link => {
        link.addEventListener('click', event => {
            const url = new URL(link.href, window.location.href);
            const targetView = url.searchParams.get('view');
            const targetIndex = targetView === 'all'
                ? (url.hash === '#about' ? 1 : 0)
                : pageDefinitions.findIndex(page => page.key === targetView);

            if (targetIndex >= 0) {
                event.preventDefault();
                goToPage(targetIndex);
                window.history.replaceState(null, '', `?view=all#${pageDefinitions[targetIndex].key}`);
            }
        });
    });

    window.addEventListener('keydown', event => {
        if (document.body.classList.contains('deck-open') || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
        if (event.key === 'ArrowLeft') goToPage(currentPage - 1);
        if (event.key === 'ArrowRight') goToPage(currentPage + 1);
    });

    const hashPage = window.location.hash.replace('#', '');
    const initialPage = hashPage === 'about'
        ? 1
        : pageDefinitions.findIndex(page => page.key === hashPage);
    goToPage(initialPage >= 0 ? initialPage : 0, 'auto');
}

// ============================================
// Mobile Navigation Toggle
// ============================================
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// ============================================
// Language switch
// ============================================
const languageSwitch = document.querySelector('.language-switch');
const translatableElements = document.querySelectorAll('[data-zh][data-en]');

function getSavedLanguage() {
    try {
        return localStorage.getItem('siteLanguage');
    } catch {
        return null;
    }
}

function saveLanguage(language) {
    try {
        localStorage.setItem('siteLanguage', language);
    } catch {
        // The page still works when storage is unavailable.
    }
}

function setLanguage(language) {
    const isEnglish = language === 'en';

    document.documentElement.lang = isEnglish ? 'en' : 'zh-CN';
    document.body.dataset.language = language;
    document.title = isEnglish ? 'Chen Xinhui — Personal Website' : '陈昕慧 — 个人网站';

    translatableElements.forEach(element => {
        element.textContent = isEnglish ? element.dataset.en : element.dataset.zh;
    });

    if (languageSwitch) {
        languageSwitch.textContent = isEnglish ? '中文' : 'EN';
        languageSwitch.setAttribute('aria-label', isEnglish ? '切换为中文' : 'Switch to English');
    }

    document.dispatchEvent(new CustomEvent('siteLanguageChange', { detail: { language } }));
}

let currentLanguage = getSavedLanguage() === 'en' ? 'en' : 'zh';
setLanguage(currentLanguage);

languageSwitch?.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
    setLanguage(currentLanguage);
    saveLanguage(currentLanguage);
});

// ============================================
// Navbar scroll effects
// ============================================
const navbar = document.querySelector('.navbar');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (scrollY > 40) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    if (scrollY > lastScrollY && scrollY > 120) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }

    lastScrollY = scrollY;
});

// ============================================
// Scroll-triggered fade-in animations
// ============================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
});

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ============================================
// Hero photo carousel
// ============================================
const heroCarousel = document.querySelector('[data-carousel]');

if (heroCarousel) {
    const slides = Array.from(heroCarousel.querySelectorAll('.photo-slide'));
    const dots = Array.from(heroCarousel.querySelectorAll('.carousel-dot'));
    const counter = heroCarousel.querySelector('.carousel-counter');
    const previousButton = heroCarousel.querySelector('.carousel-prev');
    const nextButton = heroCarousel.querySelector('.carousel-next');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeSlide = 0;
    let carouselTimer = null;

    function showSlide(index) {
        activeSlide = (index + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeSlide;
            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', String(!isActive));
        });

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === activeSlide);
        });

        if (counter) {
            counter.textContent = `${String(activeSlide + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
        }
    }

    function stopCarousel() {
        if (carouselTimer) {
            window.clearInterval(carouselTimer);
            carouselTimer = null;
        }
    }

    function startCarousel() {
        stopCarousel();
        if (!reducedMotion.matches) {
            carouselTimer = window.setInterval(() => showSlide(activeSlide + 1), 4600);
        }
    }

    previousButton?.addEventListener('click', () => {
        showSlide(activeSlide - 1);
        startCarousel();
    });

    nextButton?.addEventListener('click', () => {
        showSlide(activeSlide + 1);
        startCarousel();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            startCarousel();
        });
    });

    heroCarousel.addEventListener('mouseenter', stopCarousel);
    heroCarousel.addEventListener('mouseleave', startCarousel);
    heroCarousel.addEventListener('focusin', stopCarousel);
    heroCarousel.addEventListener('focusout', startCarousel);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopCarousel();
        } else {
            startCarousel();
        }
    });

    reducedMotion.addEventListener?.('change', startCarousel);
    showSlide(0);
    startCarousel();
}

// ============================================
// In-page presentation viewer
// ============================================
const deckViewer = document.querySelector('#deck-viewer');

if (deckViewer) {
    const deckCatalog = {
        kpmg: {
            title: {
                zh: '毕马威 ESG 案例分析方案',
                en: 'KPMG ESG Case Competition'
            },
            alt: {
                zh: '毕马威 ESG 方案第',
                en: 'KPMG ESG presentation slide'
            },
            folder: 'images/decks/kpmg',
            count: 12
        },
        coldnova: {
            title: {
                zh: 'ColdNova 辐射制冷头盔路演',
                en: 'ColdNova Radiative-Cooling Helmet Pitch'
            },
            alt: {
                zh: 'ColdNova 路演稿第',
                en: 'ColdNova pitch deck slide'
            },
            folder: 'images/decks/coldnova',
            count: 20
        },
        xfocus: {
            title: {
                zh: 'X-Focus 儿童专注力产品方案',
                en: 'X-Focus Children’s Attention Product'
            },
            alt: {
                zh: 'X-Focus 项目方案第',
                en: 'X-Focus presentation slide'
            },
            folder: 'images/decks/xfocus',
            count: 12
        },
        roland: {
            title: {
                zh: '赫莲娜 Future Masters 增长策略',
                en: 'Helena Rubinstein Future Masters Strategy'
            },
            alt: {
                zh: '罗兰贝格 × 欧莱雅咨询方案第',
                en: 'Roland Berger × L’Oréal presentation slide'
            },
            folder: 'images/decks/roland-loreal',
            count: 8
        }
    };

    const viewerTitle = deckViewer.querySelector('#deck-viewer-title');
    const slideImage = deckViewer.querySelector('.deck-slide-image');
    const counter = deckViewer.querySelector('.deck-counter');
    const progress = deckViewer.querySelector('.deck-progress span');
    const previousButton = deckViewer.querySelector('.deck-prev');
    const nextButton = deckViewer.querySelector('.deck-next');
    const closeButton = deckViewer.querySelector('.deck-close');
    const canvas = deckViewer.querySelector('.deck-canvas');
    let activeDeck = null;
    let activePage = 0;
    let returnFocus = null;
    let pointerStartX = null;

    function slidePath(deck, pageIndex) {
        return `${deck.folder}/slide-${String(pageIndex + 1).padStart(2, '0')}.webp`;
    }

    function updateDeckLanguage() {
        if (!activeDeck) return;
        const isEnglish = currentLanguage === 'en';
        viewerTitle.textContent = activeDeck.title[currentLanguage];
        slideImage.alt = isEnglish
            ? `${activeDeck.alt.en} ${activePage + 1}`
            : `${activeDeck.alt.zh} ${activePage + 1} 页`;
        previousButton.setAttribute('aria-label', isEnglish ? 'Previous slide' : '上一页');
        nextButton.setAttribute('aria-label', isEnglish ? 'Next slide' : '下一页');
        closeButton.setAttribute('aria-label', isEnglish ? 'Close presentation' : '关闭演示文稿');
        deckViewer.querySelector('.deck-backdrop').setAttribute('aria-label', isEnglish ? 'Close presentation' : '关闭演示文稿');
    }

    function preloadNeighbors() {
        [-1, 1].forEach(offset => {
            const neighbor = (activePage + offset + activeDeck.count) % activeDeck.count;
            const image = new Image();
            image.src = slidePath(activeDeck, neighbor);
        });
    }

    function showDeckPage(pageIndex, instant = false) {
        if (!activeDeck) return;
        activePage = (pageIndex + activeDeck.count) % activeDeck.count;
        if (!instant) slideImage.classList.add('is-changing');

        const nextSource = slidePath(activeDeck, activePage);
        const reveal = () => {
            slideImage.classList.remove('is-changing');
            slideImage.removeEventListener('load', reveal);
        };

        slideImage.addEventListener('load', reveal);
        slideImage.src = nextSource;
        counter.textContent = `${String(activePage + 1).padStart(2, '0')} / ${String(activeDeck.count).padStart(2, '0')}`;
        progress.style.width = `${((activePage + 1) / activeDeck.count) * 100}%`;
        updateDeckLanguage();
        preloadNeighbors();
    }

    function openDeck(deckId, trigger) {
        activeDeck = deckCatalog[deckId];
        if (!activeDeck) return;

        returnFocus = trigger;
        deckViewer.classList.add('is-open');
        deckViewer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('deck-open');
        showDeckPage(0, true);
        window.requestAnimationFrame(() => closeButton.focus());
    }

    function closeDeck() {
        if (!deckViewer.classList.contains('is-open')) return;
        deckViewer.classList.remove('is-open');
        deckViewer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('deck-open');
        slideImage.removeAttribute('src');
        activeDeck = null;
        returnFocus?.focus();
    }

    document.querySelectorAll('[data-deck]').forEach(button => {
        button.addEventListener('click', () => openDeck(button.dataset.deck, button));
    });

    deckViewer.querySelectorAll('[data-deck-close]').forEach(button => {
        button.addEventListener('click', closeDeck);
    });

    previousButton.addEventListener('click', () => showDeckPage(activePage - 1));
    nextButton.addEventListener('click', () => showDeckPage(activePage + 1));

    canvas.addEventListener('pointerdown', event => {
        pointerStartX = event.clientX;
        canvas.setPointerCapture?.(event.pointerId);
    });

    canvas.addEventListener('pointerup', event => {
        if (pointerStartX === null) return;
        const distance = event.clientX - pointerStartX;
        pointerStartX = null;
        canvas.releasePointerCapture?.(event.pointerId);
        if (Math.abs(distance) < 45) return;
        showDeckPage(activePage + (distance < 0 ? 1 : -1));
    });

    canvas.addEventListener('pointercancel', () => {
        pointerStartX = null;
    });

    document.addEventListener('keydown', event => {
        if (!deckViewer.classList.contains('is-open')) return;
        if (event.key === 'Escape') closeDeck();
        if (event.key === 'ArrowLeft') showDeckPage(activePage - 1);
        if (event.key === 'ArrowRight') showDeckPage(activePage + 1);
    });

    document.addEventListener('siteLanguageChange', updateDeckLanguage);
}

// ============================================
// Smooth anchor scroll with offset
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            const offset = 70;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});
