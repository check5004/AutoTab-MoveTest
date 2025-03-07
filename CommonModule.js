/**
 * フォーム入力共通モジュール
 * すべての入力要素に対してEnterキーによるフォーカス移動機能を提供
 */
class CommonModule {
    /**
     * コンストラクタ
     * @param {Object} options - 設定オプション
     */
    constructor(options = {}) {
        // デフォルト設定
        this.config = {
            // フォーカス可能な要素のセレクタ
            focusableSelector: 'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])',
            // デバッグモード
            debug: false,
            ...options
        };

        // 初期化
        this.initialize();
    }

    /**
     * 初期化処理
     */
    initialize() {
        // documentにイベントリスナーを追加（イベント委譲）
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        if (this.config.debug) {
            console.log('CommonModule: フォーカス移動機能を初期化しました');
            // フォーカス可能な要素の数を出力
            const focusableElements = this.getAllFocusableElements();
            console.log(`CommonModule: フォーカス可能要素数: ${focusableElements.length}`);

            // デバッグ: 検出された要素のリストを表示
            focusableElements.forEach((el, index) => {
                console.log(`${index + 1}: ${el.id || 'id無し'} (${el.tagName}) - ${el.closest('.tab-pane') ? 'タブ内' : 'タブ外'}`);
            });
        }
    }

    /**
     * すべてのフォーカス可能な要素を配列で取得
     * @returns {Array<HTMLElement>} フォーカス可能な要素の配列
     */
    getAllFocusableElements() {
        // よりディープなDOMツリーでも要素を見つけるために、display:noneのタブコンテンツも含めて検索
        // 必要に応じて後で表示状態でフィルタリング
        const allElements = document.querySelectorAll(this.config.focusableSelector);

        // 表示要素と、現在アクティブなタブ内の要素を保持する配列
        const visibleOrActiveTabElements = Array.from(allElements).filter(element => {
            // 無効な要素を除外
            if (element.disabled || element.readOnly) return false;

            // タブパネル内の要素の場合
            const tabPane = element.closest('.tab-pane');
            if (tabPane) {
                // アクティブなタブパネル内の要素かチェック
                return tabPane.classList.contains('active') || tabPane.classList.contains('show');
            }

            // タブ以外の要素は表示状態をチェック
            return this.isVisible(element);
        });

        return visibleOrActiveTabElements;
    }

    /**
     * 要素が表示されているかどうか確認
     * @param {HTMLElement} element - 確認する要素
     * @returns {boolean} 表示されている場合はtrue
     */
    isVisible(element) {
        if (!element) return false;

        // display:noneのタブコンテンツ内の要素は特別扱い
        const tabPane = element.closest('.tab-pane');
        if (tabPane && (tabPane.classList.contains('active') || tabPane.classList.contains('show'))) {
            return true;
        }

        // 要素またはその祖先が非表示でないかチェック
        const style = window.getComputedStyle(element);

        // 表示チェック（要素が視覚的に表示されているか）
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }

        // 親要素も再帰的にチェック
        if (element.parentElement) {
            return this.isVisible(element.parentElement);
        }

        return true;
    }

    /**
     * 次または前の要素にフォーカスを移動
     * @param {HTMLElement} currentElement - 現在の要素
     * @param {boolean} moveForward - 前に移動する場合はfalse
     * @returns {boolean} フォーカス移動が成功した場合はtrue
     */
    moveFocus(currentElement, moveForward) {
        const focusableElements = this.getAllFocusableElements();
        const currentIndex = focusableElements.indexOf(currentElement);

        if (currentIndex === -1) return false;

        let nextIndex;
        if (moveForward) {
            // 次の要素に移動（最後なら最初に戻る）
            nextIndex = (currentIndex + 1) % focusableElements.length;
        } else {
            // 前の要素に移動（最初なら最後に移動）
            nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
        }

        const nextElement = focusableElements[nextIndex];
        if (nextElement) {
            nextElement.focus();

            if (this.config.debug) {
                console.log(`CommonModule: ${moveForward ? '次' : '前'}へ移動 - ${currentElement.id || 'id無し'} から ${nextElement.id || 'id無し'} へ`);
            }

            return true;
        }

        return false;
    }

    /**
     * キーダウンイベントハンドラ
     * @param {Event} event - キーダウンイベント
     */
    handleKeyDown(event) {
        // Enterキーが押された場合のみ処理
        if (event.key !== 'Enter') return;

        // フォーカスのある要素を取得
        const activeElement = document.activeElement;

        // テキストエリアでの改行やボタンのクリックなど、デフォルト動作を許可する場合
        if (
            (activeElement.tagName === 'TEXTAREA' && !event.ctrlKey) || // テキストエリアの通常の改行
            activeElement.tagName === 'BUTTON' || // ボタンのクリック
            activeElement.type === 'submit' || // 送信ボタン
            activeElement.type === 'button' // 通常ボタン
        ) {
            return;
        }

        // デフォルト動作をキャンセル
        event.preventDefault();

        // Shiftキーと組み合わせで前または次の要素にフォーカス
        const moveForward = !event.shiftKey;

        // フォーカス移動
        if (!this.moveFocus(activeElement, moveForward)) {
            if (this.config.debug) {
                console.log(`CommonModule: これ以上${moveForward ? '次' : '前'}へ移動できません`);
            }
        }
    }
}

// CommonModuleをグローバル変数として公開
window.commonModule = new CommonModule({
    debug: true // デバッグ出力を有効化
});