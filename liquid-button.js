// Vanilla JS adaptation of canvas-based Liquid Button
// CloudDataLoaded removed, running instantly

    // Global mouse tracking
    let mouseX = 0, mouseY = 0;
    let mouseLastX = 0, mouseLastY = 0;
    let mouseDirectionX = 0, mouseDirectionY = 0;
    let mouseSpeedX = 0, mouseSpeedY = 0;

    function mouseDirection(e) {
        if (mouseX < e.pageX) mouseDirectionX = 1;
        else if (mouseX > e.pageX) mouseDirectionX = -1;
        else mouseDirectionX = 0;

        if (mouseY < e.pageY) mouseDirectionY = 1;
        else if (mouseY > e.pageY) mouseDirectionY = -1;
        else mouseDirectionY = 0;

        mouseX = e.pageX;
        mouseY = e.pageY;
    }
    document.addEventListener('mousemove', mouseDirection);

    function mouseSpeed() {
        mouseSpeedX = mouseX - mouseLastX;
        mouseSpeedY = mouseY - mouseLastY;
        mouseLastX = mouseX;
        mouseLastY = mouseY;
        setTimeout(mouseSpeed, 50);
    }
    mouseSpeed();

    // Map button classes to their respective colors
    const colorMap = {
        'btn-primary': {
            bg: 'rgba(37, 99, 235, 0.9)',
            grad1: 'rgba(29, 78, 216, 1.0)',
            grad2: 'rgba(30, 64, 175, 0.9)'
        },
        'btn-secondary': {
            bg: 'rgba(71, 85, 105, 0.8)',
            grad1: 'rgba(51, 65, 85, 1.0)',
            grad2: 'rgba(30, 41, 59, 1.0)'
        },
        'btn-outline': {
            bg: 'rgba(255, 255, 255, 0.05)',
            grad1: 'rgba(255, 255, 255, 0.15)',
            grad2: 'rgba(255, 255, 255, 0.05)'
        },
        'default': {
            bg: 'rgba(37, 99, 235, 0.9)',
            grad1: '#2563eb',
            grad2: '#1e40af'
        }
    };

    class LiquidButton {
        constructor(buttonEl) {
            this.button = buttonEl;
            
            // Determine colors
            this.colors = colorMap['default'];
            if (this.button.classList.contains('btn-primary')) this.colors = colorMap['btn-primary'];
            else if (this.button.classList.contains('btn-secondary')) this.colors = colorMap['btn-secondary'];
            else if (this.button.classList.contains('btn-outline')) this.colors = colorMap['btn-outline'];

            // Wrap contents in inner span if not already wrapped
            if (!this.button.querySelector('.inner')) {
                const inner = document.createElement('span');
                inner.className = 'inner';
                // Move text nodes / icons inside
                while(this.button.firstChild) {
                    inner.appendChild(this.button.firstChild);
                }
                this.button.appendChild(inner);
            }

            this.pointsA = [];
            this.pointsB = [];
            this.points = 8;
            this.viscosity = 20;
            this.mouseDist = 70;
            this.damping = 0.05;
            this.showIndicators = false;

            this.buttonWidth = this.button.offsetWidth;
            this.buttonHeight = this.button.offsetHeight;

            this.canvas = document.createElement('canvas');
            this.button.appendChild(this.canvas);
            
            this.canvas.width = this.buttonWidth + 100;
            this.canvas.height = this.buttonHeight + 100;
            this.context = this.canvas.getContext('2d');

            this.initPoints();
            this.renderCanvas = this.renderCanvas.bind(this);
            this.renderCanvas();

            // Handle Resize & Visibility Changes
            const resizeObserver = new ResizeObserver(() => {
                if (this.button.offsetWidth > 0 && this.button.offsetHeight > 0) {
                    this.buttonWidth = this.button.offsetWidth;
                    this.buttonHeight = this.button.offsetHeight;
                    this.canvas.width = this.buttonWidth + 100;
                    this.canvas.height = this.buttonHeight + 100;
                    this.initPoints();
                }
            });
            resizeObserver.observe(this.button);
        }

        getOffset() {
            const rect = this.canvas.getBoundingClientRect();
            return {
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY
            };
        }

        initPoints() {
            this.pointsA = [];
            this.pointsB = [];
            
            const x = this.buttonHeight / 2;
            for(let j = 1; j < this.points; j++) {
                this.addPoints((x+((this.buttonWidth-this.buttonHeight)/this.points)*j), 0);
            }
            this.addPoints(this.buttonWidth-this.buttonHeight/5, 0);
            this.addPoints(this.buttonWidth+this.buttonHeight/10, this.buttonHeight/2);
            this.addPoints(this.buttonWidth-this.buttonHeight/5, this.buttonHeight);
            for(let j = this.points-1; j > 0; j--) {
                this.addPoints((x+((this.buttonWidth-this.buttonHeight)/this.points)*j), this.buttonHeight);
            }
            this.addPoints(this.buttonHeight/5, this.buttonHeight);
            this.addPoints(-this.buttonHeight/10, this.buttonHeight/2);
            this.addPoints(this.buttonHeight/5, 0);
        }

        addPoints(x, y) {
            this.pointsA.push(new Point(x, y, 1, this));
            this.pointsB.push(new Point(x, y, 2, this));
        }

        renderCanvas() {
            requestAnimationFrame(this.renderCanvas);

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // No white background filling for transparent buttons
            // this.context.fillStyle = '#fff';
            // this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const offset = this.getOffset();
            const relMouseX = mouseX - offset.left;
            const relMouseY = mouseY - offset.top;

            for (let i = 0; i <= this.pointsA.length - 1; i++) {
                this.pointsA[i].move(relMouseX, relMouseY);
                this.pointsB[i].move(relMouseX, relMouseY);
            }

            const gradientX = Math.min(Math.max(relMouseX, 0), this.canvas.width);
            const gradientY = Math.min(Math.max(relMouseY, 0), this.canvas.height);
            const distance = Math.sqrt(Math.pow(gradientX - this.canvas.width/2, 2) + Math.pow(gradientY - this.canvas.height/2, 2)) / Math.sqrt(Math.pow(this.canvas.width/2, 2) + Math.pow(this.canvas.height/2, 2));

            const gradient = this.context.createRadialGradient(gradientX, gradientY, 300+(300*distance), gradientX, gradientY, 0);
            gradient.addColorStop(0, this.colors.grad1);
            gradient.addColorStop(1, this.colors.grad2);

            const groups = [this.pointsA, this.pointsB];

            for (let j = 0; j <= 1; j++) {
                const points = groups[j];

                if (j === 0) {
                    this.context.fillStyle = this.colors.bg;
                } else {
                    this.context.fillStyle = gradient;
                }

                this.context.beginPath();
                this.context.moveTo(points[0].x, points[0].y);

                for (let i = 0; i < points.length; i++) {
                    const p = points[i];
                    let nextP = points[i + 1];

                    if (nextP !== undefined) {
                        p.cx1 = (p.x+nextP.x)/2;
                        p.cy1 = (p.y+nextP.y)/2;
                        p.cx2 = (p.x+nextP.x)/2;
                        p.cy2 = (p.y+nextP.y)/2;
                        this.context.bezierCurveTo(p.x, p.y, p.cx1, p.cy1, p.cx1, p.cy1);
                    } else {
                        nextP = points[0];
                        p.cx1 = (p.x+nextP.x)/2;
                        p.cy1 = (p.y+nextP.y)/2;
                        this.context.bezierCurveTo(p.x, p.y, p.cx1, p.cy1, p.cx1, p.cy1);
                    }
                }
                this.context.fill();
            }
        }
    }

    class Point {
        constructor(x, y, level, parent) {
            this.parent = parent;
            this.x = this.ix = 50 + x;
            this.y = this.iy = 50 + y;
            this.vx = 0;
            this.vy = 0;
            this.cx1 = 0;
            this.cy1 = 0;
            this.cx2 = 0;
            this.cy2 = 0;
            this.level = level;
        }

        move(relMouseX, relMouseY) {
            this.vx += (this.ix - this.x) / (this.parent.viscosity * this.level);
            this.vy += (this.iy - this.y) / (this.parent.viscosity * this.level);

            const dx = this.ix - relMouseX;
            const dy = this.iy - relMouseY;
            const relDist = (1 - Math.sqrt((dx * dx) + (dy * dy)) / this.parent.mouseDist);

            if ((mouseDirectionX > 0 && relMouseX > this.x) || (mouseDirectionX < 0 && relMouseX < this.x)) {
                if (relDist > 0 && relDist < 1) {
                    this.vx = (mouseSpeedX / 4) * relDist;
                }
            }
            this.vx *= (1 - this.parent.damping);
            this.x += this.vx;

            if ((mouseDirectionY > 0 && relMouseY > this.y) || (mouseDirectionY < 0 && relMouseY < this.y)) {
                if (relDist > 0 && relDist < 1) {
                    this.vy = (mouseSpeedY / 4) * relDist;
                }
            }
            this.vy *= (1 - this.parent.damping);
            this.y += this.vy;
        }
    }

    function initLiquidButtons() {
        document.querySelectorAll('.btn-liquid:not(.liquid-initialized)').forEach(btn => {
            btn.classList.add('liquid-initialized');
            new LiquidButton(btn);
        });
    }

    // Initialize immediately for buttons already in the DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLiquidButtons);
    } else {
        initLiquidButtons();
    }

    // Watch for dynamically added buttons (e.g., after data loads)
    const observer = new MutationObserver((mutations) => {
        let shouldInit = false;
        mutations.forEach(m => {
            if (m.addedNodes.length > 0) shouldInit = true;
        });
        if (shouldInit) initLiquidButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
