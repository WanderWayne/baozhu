// 地图镜头系统：允许拖动背景平移视角 + 第一关房间轮廓边界
(function() {
    function getLevelIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'free') return null;
        return parseInt(params.get('level'), 10) || 1;
    }

    class GameMapCamera {
        constructor() {
            this.viewport = document.getElementById('game-map-viewport');
            this.world = document.getElementById('game-map-world');
            if (!this.viewport || !this.world) return;

            this.isDragging = false;
            this.mapX = 0;
            this.mapY = 0;
            this.dragStart = { x: 0, y: 0 };
            this.dragOrigin = { x: 0, y: 0 };
            this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
            this.isInitialized = false;
            this.overscrollLimit = 96;
            this.springAnimId = null;
            this.springVelocity = { x: 0, y: 0 };

            this.levelId = getLevelIdFromUrl();
            this.roomMode = this.levelId === 1;
            this.rooms = [];
            this.unlockedRoomIds = [];
            this.boundaryWallEl = null;

            this.bindEvents();
            if (this.roomMode) {
                this.setupRoomLayout();
                this.renderBoundaryWall();
            }
            this.refreshBounds(false);
        }

        setupRoomLayout() {
            const w = this.world.offsetWidth;
            const h = this.world.offsetHeight;
            if (w <= 0 || h <= 0) return;
            const halfW = w / 2;
            this.rooms = [
                { id: 'roomA', left: 0, top: 0, width: halfW, height: h },
                { id: 'roomB', left: halfW, top: 0, width: halfW, height: h }
            ];
            this.unlockedRoomIds = ['roomA'];
        }

        getUnlockedUnion() {
            if (!this.roomMode || this.unlockedRoomIds.length === 0) return null;
            const unlocked = this.rooms.filter(r => this.unlockedRoomIds.includes(r.id));
            if (unlocked.length === 0) return null;
            const left = Math.min(...unlocked.map(r => r.left));
            const top = Math.min(...unlocked.map(r => r.top));
            const right = Math.max(...unlocked.map(r => r.left + r.width));
            const bottom = Math.max(...unlocked.map(r => r.top + r.height));
            return { left, top, right, bottom };
        }

        isPointInUnlockedRooms(worldX, worldY) {
            const union = this.getUnlockedUnion();
            if (!union) return true;
            return worldX >= union.left && worldX <= union.right && worldY >= union.top && worldY <= union.bottom;
        }

        bindEvents() {
            this.onStartBound = this.onStart.bind(this);
            this.onMoveBound = this.onMove.bind(this);
            this.onEndBound = this.onEnd.bind(this);
            this.onResizeBound = this.onResize.bind(this);

            this.viewport.addEventListener('mousedown', this.onStartBound);
            this.viewport.addEventListener('touchstart', this.onStartBound, { passive: false });
            window.addEventListener('mousemove', this.onMoveBound);
            window.addEventListener('touchmove', this.onMoveBound, { passive: false });
            window.addEventListener('mouseup', this.onEndBound);
            window.addEventListener('touchend', this.onEndBound);
            window.addEventListener('touchcancel', this.onEndBound);
            window.addEventListener('resize', this.onResizeBound);
        }

        onResize() {
            if (this.roomMode && this.rooms.length > 0) {
                const w = this.world.offsetWidth;
                const h = this.world.offsetHeight;
                const halfW = w / 2;
                this.rooms[0].width = halfW;
                this.rooms[0].height = h;
                this.rooms[1].left = halfW;
                this.rooms[1].width = halfW;
                this.rooms[1].height = h;
                this.renderBoundaryWall();
            }
            this.refreshBounds(true);
        }

        getPointFromEvent(e) {
            if (e.type.startsWith('touch')) {
                const touch = e.touches[0] || e.changedTouches[0];
                if (!touch) return null;
                return { x: touch.clientX, y: touch.clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        isBlockedTarget(target) {
            if (!target || typeof target.closest !== 'function') return false;
            return Boolean(target.closest(
                '.game-item, #inventory-area, .back-btn, .identity-plaque, ' +
                'button, input, textarea, select, .modal-overlay, .extract-card-modal, ' +
                '.tutorial-overlay, .level-intro-overlay, #basic-completion-overlay'
            ));
        }

        onStart(e) {
            if (e.type === 'touchstart' && e.touches.length > 1) return;
            if (this.isBlockedTarget(e.target)) return;

            const point = this.getPointFromEvent(e);
            if (!point) return;

            this.stopSpringAnimation();
            this.isDragging = true;
            this.dragStart.x = point.x;
            this.dragStart.y = point.y;
            this.dragOrigin.x = this.mapX;
            this.dragOrigin.y = this.mapY;
            this.viewport.classList.add('is-panning');

            if (e.type.startsWith('touch')) {
                e.preventDefault();
            }
        }

        onMove(e) {
            if (!this.isDragging) return;
            if (e.type === 'touchmove' && e.touches.length > 1) return;

            const point = this.getPointFromEvent(e);
            if (!point) return;

            const nextX = this.dragOrigin.x + (point.x - this.dragStart.x);
            const nextY = this.dragOrigin.y + (point.y - this.dragStart.y);
            this.setMapPosition(nextX, nextY, true);

            if (e.type.startsWith('touch')) {
                e.preventDefault();
            }
        }

        onEnd() {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.viewport.classList.remove('is-panning');
            this.springBackIfNeeded();
        }

        refreshBounds(keepCurrentPosition) {
            const viewportWidth = this.viewport.clientWidth;
            const viewportHeight = this.viewport.clientHeight;
            const worldWidth = this.world.offsetWidth;
            const worldHeight = this.world.offsetHeight;

            if (this.roomMode && this.rooms.length === 0 && worldWidth > 0) {
                this.setupRoomLayout();
                this.renderBoundaryWall();
            }

            if (this.roomMode && this.unlockedRoomIds.length > 0) {
                const union = this.getUnlockedUnion();
                if (union) {
                    this.bounds.minX = viewportWidth - union.right;
                    this.bounds.maxX = -union.left;
                    this.bounds.minY = viewportHeight - union.bottom;
                    this.bounds.maxY = -union.top;
                } else {
                    this.bounds.minX = Math.min(0, viewportWidth - worldWidth);
                    this.bounds.maxX = 0;
                    this.bounds.minY = Math.min(0, viewportHeight - worldHeight);
                    this.bounds.maxY = 0;
                }
            } else {
                this.bounds.minX = Math.min(0, viewportWidth - worldWidth);
                this.bounds.maxX = 0;
                this.bounds.minY = Math.min(0, viewportHeight - worldHeight);
                this.bounds.maxY = 0;
            }

            if (!this.isInitialized || !keepCurrentPosition) {
                const centeredX = (viewportWidth - worldWidth) / 2;
                const initialY = -90;
                if (this.roomMode) {
                    const union = this.getUnlockedUnion();
                    if (union) {
                        const midX = (union.left + union.right) / 2;
                        this.mapX = this.clampXStrict(viewportWidth / 2 - midX);
                    } else {
                        this.mapX = this.clampXStrict(centeredX);
                    }
                } else {
                    this.mapX = this.clampXStrict(centeredX);
                }
                this.mapY = this.clampYStrict(initialY);
                this.isInitialized = true;
            } else {
                this.mapX = this.clampXStrict(this.mapX);
                this.mapY = this.clampYStrict(this.mapY);
            }

            this.applyTransform();
        }

        renderBoundaryWall() {
            if (!this.roomMode || this.rooms.length < 2) return;
            const roomA = this.rooms[0];
            const wallLeft = roomA.left + roomA.width;
            const wallWidth = 135;
            if (!this.boundaryWallEl) {
                this.boundaryWallEl = document.createElement('div');
                this.boundaryWallEl.className = 'map-boundary-wall';
                this.boundaryWallEl.setAttribute('aria-hidden', 'true');
                this.world.appendChild(this.boundaryWallEl);
            }
            this.boundaryWallEl.style.left = wallLeft + 'px';
            this.boundaryWallEl.style.width = wallWidth + 'px';
            this.boundaryWallEl.style.top = '0';
            this.boundaryWallEl.style.height = roomA.height + 'px';
            if (this.unlockedRoomIds.includes('roomB')) {
                this.boundaryWallEl.classList.add('unlocked');
            } else {
                this.boundaryWallEl.classList.remove('unlocked');
            }
        }

        clampXStrict(value) {
            return Math.max(this.bounds.minX, Math.min(this.bounds.maxX, value));
        }

        clampYStrict(value) {
            return Math.max(this.bounds.minY, Math.min(this.bounds.maxY, value));
        }

        getElasticOffset(distance) {
            const limited = this.overscrollLimit * (1 - (1 / (distance / this.overscrollLimit + 1)));
            return Math.min(this.overscrollLimit, limited);
        }

        applyElasticClamp(value, min, max) {
            if (value < min) {
                return min - this.getElasticOffset(min - value);
            }
            if (value > max) {
                return max + this.getElasticOffset(value - max);
            }
            return value;
        }

        setMapPosition(nextX, nextY, allowElastic = false) {
            if (allowElastic) {
                this.mapX = this.applyElasticClamp(nextX, this.bounds.minX, this.bounds.maxX);
                this.mapY = this.applyElasticClamp(nextY, this.bounds.minY, this.bounds.maxY);
            } else {
                this.mapX = this.clampXStrict(nextX);
                this.mapY = this.clampYStrict(nextY);
            }
            this.applyTransform();
        }

        springBackIfNeeded() {
            const targetX = this.clampXStrict(this.mapX);
            const targetY = this.clampYStrict(this.mapY);
            const needsX = Math.abs(targetX - this.mapX) > 0.1;
            const needsY = Math.abs(targetY - this.mapY) > 0.1;
            if (!needsX && !needsY) return;

            this.stopSpringAnimation();
            this.springVelocity.x = 0;
            this.springVelocity.y = 0;

            const stiffness = 0.12;
            const damping = 0.8;

            const animate = () => {
                const dx = targetX - this.mapX;
                const dy = targetY - this.mapY;

                this.springVelocity.x = (this.springVelocity.x + dx * stiffness) * damping;
                this.springVelocity.y = (this.springVelocity.y + dy * stiffness) * damping;

                this.mapX += this.springVelocity.x;
                this.mapY += this.springVelocity.y;
                this.applyTransform();

                const doneX = Math.abs(dx) < 0.35 && Math.abs(this.springVelocity.x) < 0.35;
                const doneY = Math.abs(dy) < 0.35 && Math.abs(this.springVelocity.y) < 0.35;
                if (doneX && doneY) {
                    this.mapX = targetX;
                    this.mapY = targetY;
                    this.applyTransform();
                    this.stopSpringAnimation();
                    return;
                }

                this.springAnimId = requestAnimationFrame(animate);
            };

            this.springAnimId = requestAnimationFrame(animate);
        }

        stopSpringAnimation() {
            if (this.springAnimId !== null) {
                cancelAnimationFrame(this.springAnimId);
                this.springAnimId = null;
            }
        }

        applyTransform() {
            this.world.style.transform = `translate3d(${this.mapX}px, ${this.mapY}px, 0)`;
        }

        unlockNextRoom() {
            if (!this.roomMode || this.rooms.length < 2) return;
            if (this.unlockedRoomIds.includes('roomB')) return;
            this.unlockedRoomIds.push('roomB');
            this.renderBoundaryWall();
            this.refreshBounds(true);
        }
    }

    window.GameMapCamera = GameMapCamera;

    document.addEventListener('DOMContentLoaded', () => {
        window.GameMapCameraInstance = new GameMapCamera();
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyO' && window.GameMapCameraInstance && window.GameMapCameraInstance.roomMode) {
                window.GameMapCameraInstance.unlockNextRoom();
            }
        });
    });
})();
