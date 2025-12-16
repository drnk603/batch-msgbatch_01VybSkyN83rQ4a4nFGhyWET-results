(function() {
    'use strict';

    if (window.__appInit) return;
    window.__appInit = true;

    const CONFIG = {
        HEADER_HEIGHT: 64,
        HEADER_HEIGHT_MOBILE: 56,
        DEBOUNCE_DELAY: 200,
        THROTTLE_DELAY: 100,
        ANIMATION_DURATION: 600,
        SCROLL_OFFSET: 80,
        BREAKPOINT_LG: 1024,
        THANK_YOU_PAGE: 'thank_you.html'
    };

    const VALIDATORS = {
        name: {
            pattern: /^[a-zA-ZÀ-ÿ\s-']{2,50}$/,
            message: 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen, nur Buchstaben)'
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
        },
        phone: {
            pattern: /^[\d\s+\-()]{10,20}$/,
            message: 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen)'
        },
        message: {
            minLength: 10,
            message: 'Bitte geben Sie mindestens 10 Zeichen ein'
        },
        checkbox: {
            message: 'Bitte akzeptieren Sie die Datenschutzerklärung'
        }
    };

    const STATE = {
        menuOpen: false,
        scrollY: 0,
        isScrolling: false
    };

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function sanitizeInput(str) {
        const map = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return String(str).replace(/[<>"'/]/g, s => map[s]);
    }

    class BurgerMenu {
        constructor() {
            this.nav = document.querySelector('.c-nav#main-nav');
            this.toggle = document.querySelector('.c-nav__toggle');
            this.navList = this.nav?.querySelector('.c-nav__list');
            this.body = document.body;
            
            if (!this.nav || !this.toggle || !this.navList) return;
            
            this.init();
        }

        init() {
            this.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMenu();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && STATE.menuOpen) {
                    this.closeMenu();
                    this.toggle.focus();
                }
            });

            document.addEventListener('click', (e) => {
                if (STATE.menuOpen && !this.nav.contains(e.target) && e.target !== this.toggle) {
                    this.closeMenu();
                }
            });

            this.navList.querySelectorAll('.c-nav__link').forEach(link => {
                link.addEventListener('click', () => {
                    if (STATE.menuOpen) this.closeMenu();
                });
            });

            window.addEventListener('resize', throttle(() => {
                if (window.innerWidth >= CONFIG.BREAKPOINT_LG && STATE.menuOpen) {
                    this.closeMenu();
                }
            }, CONFIG.THROTTLE_DELAY), { passive: true });
        }

        toggleMenu() {
            STATE.menuOpen ? this.closeMenu() : this.openMenu();
        }

        openMenu() {
            STATE.menuOpen = true;
            this.nav.style.height = 'calc(100vh - var(--header-h))';
            this.nav.classList.add('is-open');
            this.toggle.classList.add('is-open');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.body.classList.add('u-no-scroll');
        }

        closeMenu() {
            STATE.menuOpen = false;
            this.nav.style.height = '';
            this.nav.classList.remove('is-open');
            this.toggle.classList.remove('is-open');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.body.classList.remove('u-no-scroll');
        }
    }

    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            const isHome = ['/', '/index.html'].some(path => 
                window.location.pathname === path || window.location.pathname.endsWith(path)
            );

            if (!isHome) {
                document.querySelectorAll('.c-nav__link[href^="#"]').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href !== '#') {
                        link.setAttribute('href', '/' + href);
                    }
                });
            }

            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const href = anchor.getAttribute('href');
                    if (!href || href === '#') return;

                    const targetId = href.replace(/^\/?#/, '');
                    const target = document.getElementById(targetId);

                    if (target) {
                        e.preventDefault();
                        this.scrollTo(target);
                        history.pushState(null, null, '#' + targetId);
                    }
                });
            });
        }

        scrollTo(element) {
            const header = document.querySelector('.l-header');
            const offset = header ? header.offsetHeight : CONFIG.SCROLL_OFFSET;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    class ScrollSpy {
        constructor() {
            this.sections = document.querySelectorAll('[id]');
            this.navLinks = document.querySelectorAll('.c-nav__link[href^="#"]');
            if (this.sections.length && this.navLinks.length) this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.setActiveLink(entry.target.id);
                    }
                });
            }, {
                rootMargin: '-20% 0px -70% 0px',
                threshold: 0
            });

            this.sections.forEach(section => observer.observe(section));
        }

        setActiveLink(id) {
            this.navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === '#' + id) {
                    link.classList.add('is-active');
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.classList.remove('is-active');
                    link.removeAttribute('aria-current');
                }
            });
        }
    }

    class FormValidator {
        constructor(form) {
            this.form = form;
            this.submitBtn = form.querySelector('button[type="submit"]');
            this.init();
        }

        init() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            this.form.querySelectorAll('input, textarea, select').forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => this.clearError(field));
            });
        }

        validateField(field) {
            const value = field.value.trim();
            const type = field.type;
            const id = field.id;
            let isValid = true;
            let message = '';

            if (field.hasAttribute('required') && !value) {
                isValid = false;
                message = 'Dieses Feld ist erforderlich';
            } else if (value) {
                if (type === 'email' || id.includes('email')) {
                    if (!VALIDATORS.email.pattern.test(value)) {
                        isValid = false;
                        message = VALIDATORS.email.message;
                    }
                } else if (type === 'tel' || id.includes('phone')) {
                    if (!VALIDATORS.phone.pattern.test(value)) {
                        isValid = false;
                        message = VALIDATORS.phone.message;
                    }
                } else if (id.includes('name') || id.includes('first') || id.includes('last')) {
                    if (!VALIDATORS.name.pattern.test(value)) {
                        isValid = false;
                        message = VALIDATORS.name.message;
                    }
                } else if (field.tagName === 'TEXTAREA' || id.includes('message')) {
                    if (value.length < VALIDATORS.message.minLength) {
                        isValid = false;
                        message = VALIDATORS.message.message;
                    }
                }
            }

            if (type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
                isValid = false;
                message = VALIDATORS.checkbox.message;
            }

            if (!isValid) {
                this.showError(field, message);
            } else {
                this.clearError(field);
            }

            return isValid;
        }

        showError(field, message) {
            this.clearError(field);
            
            field.classList.add('has-error');
            field.setAttribute('aria-invalid', 'true');
            
            const error = document.createElement('span');
            error.className = 'c-form__error';
            error.textContent = message;
            error.id = `${field.id}-error`;
            field.setAttribute('aria-describedby', error.id);
            
            const wrapper = field.closest('.c-form__group') || field.closest('.c-form__checkbox-wrapper') || field.closest('.form-check');
            if (wrapper) {
                wrapper.appendChild(error);
            } else {
                field.parentNode.insertBefore(error, field.nextSibling);
            }
        }

        clearError(field) {
            field.classList.remove('has-error');
            field.removeAttribute('aria-invalid');
            field.removeAttribute('aria-describedby');
            
            const error = field.parentNode.querySelector('.c-form__error');
            if (error) error.remove();
        }

        validateAll() {
            let isValid = true;
            const fields = this.form.querySelectorAll('input, textarea, select');
            
            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        disableSubmit() {
            if (!this.submitBtn) return;
            this.originalText = this.submitBtn.innerHTML;
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';
        }

        enableSubmit() {
            if (!this.submitBtn) return;
            this.submitBtn.disabled = false;
            if (this.originalText) {
                this.submitBtn.innerHTML = this.originalText;
            }
        }

        handleSubmit(e) {
            e.preventDefault();

            if (!this.validateAll()) {
                this.form.classList.add('was-validated');
                return;
            }

            this.disableSubmit();

            const formData = new FormData(this.form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = sanitizeInput(value);
            });

            setTimeout(() => {
                this.enableSubmit();
                window.location.href = CONFIG.THANK_YOU_PAGE;
            }, 1000);
        }
    }

    class ScrollAnimations {
        constructor() {
            this.init();
        }

        init() {
            const elements = document.querySelectorAll('img, .c-card, .c-feature, .c-testimonial, .c-stat-card, .c-button, .c-service-card, .c-team-card, .c-process-step, .c-download-card');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            elements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease-out, transform ${CONFIG.ANIMATION_DURATION}ms ease-out`;
                observer.observe(el);
            });
        }
    }

    class CountUpAnimation {
        constructor() {
            this.counters = document.querySelectorAll('.c-stat-card__number');
            if (this.counters.length) this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            this.counters.forEach(counter => observer.observe(counter));
        }

        animateCounter(element) {
            const target = parseInt(element.textContent.replace(/\D/g, ''));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    element.textContent = Math.floor(current) + (element.textContent.includes('+') ? '+' : '');
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = target + (element.textContent.includes('+') ? '+' : '');
                }
            };

            updateCounter();
        }
    }

    class RippleEffect {
        constructor() {
            this.init();
        }

        init() {
            const buttons = document.querySelectorAll('.c-button, .btn, .c-nav__link, a.c-card');
            
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const ripple = document.createElement('span');
                    const rect = button.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;

                    ripple.style.cssText = `
                        position: absolute;
                        width: ${size}px;
                        height: ${size}px;
                        top: ${y}px;
                        left: ${x}px;
                        background: rgba(255, 255, 255, 0.5);
                        border-radius: 50%;
                        transform: scale(0);
                        animation: ripple 600ms ease-out;
                        pointer-events: none;
                    `;

                    button.style.position = 'relative';
                    button.style.overflow = 'hidden';
                    button.appendChild(ripple);

                    setTimeout(() => ripple.remove(), 600);
                });
            });

            const style = document.createElement('style');
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    class ImageLoader {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('img').forEach(img => {
                if (!img.hasAttribute('loading') && !img.hasAttribute('data-critical')) {
                    img.setAttribute('loading', 'lazy');
                }

                if (!img.classList.contains('img-fluid')) {
                    img.classList.add('img-fluid');
                }

                img.addEventListener('error', function() {
                    this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236c757d" font-family="sans-serif" font-size="18"%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E';
                    this.style.objectFit = 'contain';
                });
            });
        }
    }

    class PrivacyModal {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('a[href*="privacy"], a[href*="datenschutz"]').forEach(link => {
                if (!link.closest('nav') && link.getAttribute('href') !== '/privacy.html') {
                    link.addEventListener('click', (e) => {
                        if (window.location.pathname !== '/privacy.html') {
                            e.preventDefault();
                            window.location.href = '/privacy.html';
                        }
                    });
                }
            });
        }
    }

    function init() {
        new BurgerMenu();
        new SmoothScroll();
        new ScrollSpy();
        new ScrollAnimations();
        new CountUpAnimation();
        new RippleEffect();
        new ImageLoader();
        new PrivacyModal();

        document.querySelectorAll('.c-form, form.needs-validation').forEach(form => {
            new FormValidator(form);
        });

        window.addEventListener('scroll', throttle(() => {
            STATE.scrollY = window.pageYOffset;
        }, CONFIG.THROTTLE_DELAY), { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();