/**
 * タブ移動機能強化モジュール
 * 有効なInputの最初または最後の項目でTabまたはEnterキーを押したときに
 * タブを切り替えて次/前のタブの先頭/最後のInputにフォーカスする機能
 */
class TabNavigationUtil {
    // 設定をクラス変数として定義
    config = {
        // 入力フィールドのセレクタ
        inputSelector: 'input[type="text"], input[type="number"], select, textarea, button:not([type="submit"])',
        // デバッグモード
        debug: false,
        // タブコンテンツに関するセレクタ/クラス名（jQuery版向けに変更）
        tabContentSelector: {
            tabPane: '.tab-pane',
            activeClass: 'active',
        },
        // コールバック関数
        callbacks: {
            // タブ切り替えコールバック (direction, fromTabId, toTabId) => void
            onTabChange: null,
            // 次のセクションへ移動コールバック (fromTabId) => void
            onNextSection: null,
            // 前のセクションへ移動コールバック (fromTabId) => void
            onPrevSection: null
        }
    };

    /**
     * タブナビゲーション機能を初期化する
     * @param {Array<string>} tabIds - タブのID配列（順序が重要）
     * @param {Object} options - オプション設定
     */
    initialize(tabIds, options = {}) {
        if (!tabIds || !Array.isArray(tabIds) || tabIds.length === 0) {
            console.error('タブIDの配列が正しく指定されていません');
            return;
        }

        // コールバック設定をマージ
        if (options.callbacks) {
            this.config.callbacks = {...this.config.callbacks, ...options.callbacks};
            delete options.callbacks;
        }

        // タブコンテンツ関連の設定をマージ
        if (options.tabContentSelector) {
            this.config.tabContentSelector = {
                ...this.config.tabContentSelector,
                ...options.tabContentSelector
            };
            delete options.tabContentSelector;
        }

        // その他のオプションをマージ
        Object.assign(this.config, options);

        // タブID配列を保存
        this.config.tabIds = tabIds;

        // イベントリスナーを登録
        this.attachEventListeners();

        if (this.config.debug) {
            console.log('タブナビゲーション拡張機能が初期化されました', this.config);
        }
    }

    /**
     * イベントリスナーを登録する
     */
    attachEventListeners() {
        // イベント委譲パターンを使用して、document自体にキーダウンイベントリスナーを追加（キャプチャフェーズで）
        document.addEventListener('keydown', (event) => {
            // タブコンテンツ内の要素かどうかを確認
            const targetElement = event.target;
            const tabPaneSelector = this.config.tabContentSelector.tabPane;
            const tabPane = targetElement.closest(tabPaneSelector);

            // タブ内の要素のみを処理
            if (tabPane && this.config.tabIds.includes(tabPane.id)) {
                // 設定されたinputSelectorに一致する要素か確認
                if (targetElement.matches(this.config.inputSelector)) {
                    // ナビゲーションハンドラを呼び出す
                    this.handleKeyNavigation(event);
                }
            }
        }, true); // trueを指定することでキャプチャフェーズで処理

        if (this.config.debug) {
            this.config.tabIds.forEach(tabId => {
                // デバッグログ用に各タブのフォーカス可能な要素をログ出力
                const tabInputs = this.getInputsInTab(tabId);
                console.log(`タブ ${tabId} 内の入力要素数: ${tabInputs.length}`);

                tabInputs.forEach(input => {
                    if (input.id) {
                        console.log(`登録対象: ${input.id}`);
                    }
                });
            });

            console.log('タブナビゲーション: キャプチャフェーズでdocumentにイベントリスナーを登録しました');
        }
    }

    /**
     * タブ内の全ての入力要素を取得する
     * @param {string} tabId - タブID
     * @returns {Array<HTMLElement>} 入力要素の配列
     */
    getInputsInTab(tabId) {
        const tabElement = document.getElementById(tabId);
        if (!tabElement) return [];

        return Array.from(tabElement.querySelectorAll(this.config.inputSelector));
    }

    /**
     * タブ内の有効な入力要素を取得する
     * @param {string} tabId - タブID
     * @returns {Array<HTMLElement>} 有効な入力要素の配列
     */
    getEnabledInputsInTab(tabId) {
        // すべての入力要素を取得し、有効なものだけをフィルタリング
        const allInputs = this.getInputsInTab(tabId);
        const enabledInputs = allInputs.filter(input =>
            !input.disabled &&
            !input.readOnly &&
            this.isVisibleElement(input)
        );

        if (this.config.debug) {
            console.log(`タブ ${tabId} の有効な入力要素数: ${enabledInputs.length}/${allInputs.length}`);
            if (enabledInputs.length > 0) {
                console.log(`- 最初: ${enabledInputs[0].id || '不明'}, 最後: ${enabledInputs[enabledInputs.length - 1].id || '不明'}`);
            }
        }

        return enabledInputs;
    }

    /**
     * 要素が視覚的に表示されているかどうかをチェック
     * @param {HTMLElement} element - チェックする要素
     * @returns {boolean} 表示されている場合はtrue
     */
    isVisibleElement(element) {
        if (!element) return false;

        // タブペインにある場合はアクティブなタブかチェック
        const tabPaneSelector = this.config.tabContentSelector.tabPane;
        const tabPane = element.closest(tabPaneSelector);
        if (tabPane) {
            // タブコンテンツのアクティブ状態をチェック（設定から動的に取得）
            const isActive = tabPane.classList.contains(this.config.tabContentSelector.activeClass);

            if (!isActive) {
                if (this.config.debug) {
                    console.log(`要素 ${element.id || '不明'} は非アクティブタブ内のため非表示と判定`);
                }
                return false;
            }
        }

        // 要素の表示スタイルをチェック
        const style = window.getComputedStyle(element);
        if (style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0' ||
            parseInt(style.height, 10) === 0) {
            return false;
        }

        // 要素が画面内にあるかチェック (getBoundingClientRect)
        const rect = element.getBoundingClientRect();
        const hasNoSize = rect.width === 0 && rect.height === 0;

        return !hasNoSize && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }

    /**
     * このタブが最後のタブかチェック
     * @param {string} tabId - チェックするタブID
     * @returns {boolean} 最後のタブならtrue
     */
    isLastTab(tabId) {
        const lastTabId = this.config.tabIds[this.config.tabIds.length - 1];
        return tabId === lastTabId;
    }

    /**
     * このタブが最初のタブかチェック
     * @param {string} tabId - チェックするタブID
     * @returns {boolean} 最初のタブならtrue
     */
    isFirstTab(tabId) {
        const firstTabId = this.config.tabIds[0];
        return tabId === firstTabId;
    }

    /**
     * 次のタブのIDを取得する
     * @param {string} currentTabId - 現在のタブID
     * @returns {string|null} 次のタブのID、ない場合はnull
     */
    getNextTabId(currentTabId) {
        const currentIndex = this.config.tabIds.indexOf(currentTabId);
        if (currentIndex === -1 || currentIndex === this.config.tabIds.length - 1) {
            return null; // 最後のタブまたは不明なタブの場合
        }
        return this.config.tabIds[currentIndex + 1];
    }

    /**
     * 前のタブのIDを取得する
     * @param {string} currentTabId - 現在のタブID
     * @returns {string|null} 前のタブのID、ない場合はnull
     */
    getPrevTabId(currentTabId) {
        const currentIndex = this.config.tabIds.indexOf(currentTabId);
        if (currentIndex <= 0) {
            return null; // 最初のタブまたは不明なタブの場合
        }
        return this.config.tabIds[currentIndex - 1];
    }

    /**
     * 要素からタブIDを取得する
     * @param {HTMLElement} element - 対象要素
     * @returns {string|null} タブID
     */
    getTabIdFromElement(element) {
        if (!element) return null;

        // 親要素をたどってタブを見つける
        const tabPaneSelector = this.config.tabContentSelector.tabPane;
        const tabPane = element.closest(tabPaneSelector);
        if (!tabPane) return null;

        // タブIDかどうか確認
        const tabId = tabPane.id;
        return this.config.tabIds.includes(tabId) ? tabId : null;
    }

    /**
     * 入力フィールドがタブ内で最初の有効な入力かどうかを判定する
     * @param {HTMLElement} inputElement - 判定する入力要素
     * @returns {boolean} 最初の入力の場合はtrue
     */
    isFirstInputInTab(inputElement) {
        const tabId = this.getTabIdFromElement(inputElement);
        if (!tabId) return false;

        const enabledInputs = this.getEnabledInputsInTab(tabId);
        const result = enabledInputs.length > 0 && inputElement === enabledInputs[0];

        if (this.config.debug) {
            console.log(`isFirstInputInTab: タブ ${tabId} 内の要素 ${inputElement.id || '不明'} は最初の入力${result ? 'である' : 'ではない'}`);
            console.log(`- 有効な入力要素数: ${enabledInputs.length}`);
            if (enabledInputs.length > 0) {
                console.log(`- 最初の入力要素ID: ${enabledInputs[0].id || '不明'}`);
            }
        }

        return result;
    }

    /**
     * 入力フィールドがタブ内で最後の有効な入力かどうかを判定する
     * @param {HTMLElement} inputElement - 判定する入力要素
     * @returns {boolean} 最後の入力の場合はtrue
     */
    isLastInputInTab(inputElement) {
        const tabId = this.getTabIdFromElement(inputElement);
        if (!tabId) return false;

        const enabledInputs = this.getEnabledInputsInTab(tabId);
        const result = enabledInputs.length > 0 && inputElement === enabledInputs[enabledInputs.length - 1];

        if (this.config.debug) {
            console.log(`isLastInputInTab: タブ ${tabId} 内の要素 ${inputElement.id || '不明'} は最後の入力${result ? 'である' : 'ではない'}`);
            console.log(`- 有効な入力要素数: ${enabledInputs.length}`);
            if (enabledInputs.length > 0) {
                console.log(`- 最後の入力要素ID: ${enabledInputs[enabledInputs.length - 1].id || '不明'}`);
            }
        }

        return result;
    }

    /**
     * キーボードナビゲーションイベントハンドラ
     * タブの最初/最後の入力フィールドでEnterキーが押されたときにのみ特別処理を行う
     * @param {Event} event - キーダウンイベント
     */
    handleKeyNavigation(event) {
        // TabキーとEnterキーの両方を検出（処理は別々）
        const isTab = event.key === 'Tab';
        const isEnter = event.key === 'Enter';

        if (!isTab && !isEnter) return;

        // テキストエリアの通常の改行処理を許可（Enterキーの場合）
        if (isEnter && event.target.tagName === 'TEXTAREA' && !event.ctrlKey) {
            return;
        }

        // ボタンのクリック動作を許可（Enterキーの場合）
        if (isEnter && (
            event.target.tagName === 'BUTTON' ||
            event.target.type === 'submit' ||
            event.target.type === 'button'
        )) {
            return;
        }

        // 現在のタブIDを取得
        const tabId = this.getTabIdFromElement(event.target);
        if (!tabId) return;

        const isShiftKey = event.shiftKey;

        // デバッグ情報
        if (this.config.debug) {
            const keyName = isTab ? 'Tab' : 'Enter';
            console.log(`タブ制御キー検出: ${keyName}キー（${isShiftKey ? '前へ' : '次へ'}）, タブ: ${tabId}, 要素: ${event.target.id}`);
        }

        // 現在フォーカスがある要素が最初/最後かどうかチェック
        const isLastInput = this.isLastInputInTab(event.target);
        const isFirstInput = this.isFirstInputInTab(event.target);

        if (this.config.debug) {
            console.log(`処理前チェック: 最初=${isFirstInput}, 最後=${isLastInput}`);
        }

        // Enterキーの場合のタブ切り替え
        if (isEnter) {
            if (isShiftKey && isFirstInput) {
                // 最初の要素でShift+Enterが押された場合
                if (this.isFirstTab(tabId)) {
                    // 最初のタブの場合は前のセクションへ
                    if (this.config.callbacks.onPrevSection) {
                        this.config.callbacks.onPrevSection(tabId);
                        event.preventDefault();
                        event.stopImmediatePropagation(); // 伝播を完全に停止
                        console.log('前のセクションへ移動処理を実行');
                        return true;
                    }
                } else {
                    // 前のタブへ移動
                    const prevTabId = this.getPrevTabId(tabId);
                    if (prevTabId && this.config.callbacks.onTabChange) {
                        this.config.callbacks.onTabChange('prev', tabId, prevTabId);
                        event.preventDefault();
                        event.stopImmediatePropagation(); // 伝播を完全に停止
                        console.log(`前のタブ ${prevTabId} へ移動処理を実行`);
                        return true;
                    }
                }
            } else if (!isShiftKey && isLastInput) {
                // 最後の要素でEnterが押された場合
                if (this.isLastTab(tabId)) {
                    // 最後のタブの場合は次のセクションへ
                    if (this.config.callbacks.onNextSection) {
                        console.log('次のセクションへ移動を実行します');
                        this.config.callbacks.onNextSection(tabId);
                        event.preventDefault();
                        event.stopImmediatePropagation(); // 伝播を完全に停止
                        return true;
                    }
                } else {
                    // 次のタブへ移動
                    const nextTabId = this.getNextTabId(tabId);
                    if (nextTabId && this.config.callbacks.onTabChange) {
                        console.log(`次のタブ ${nextTabId} へ移動を実行します`);
                        this.config.callbacks.onTabChange('next', tabId, nextTabId);
                        event.preventDefault();
                        event.stopImmediatePropagation(); // 伝播を完全に停止
                        return true;
                    }
                }
            }
        }

        // Tabキーの場合のタブ切り替え
        else if (isTab) {
            // 最初の要素でShift+Tabが押された場合、または
            // 最後の要素でTabが押された場合
            if ((isShiftKey && isFirstInput) ||
                (!isShiftKey && isLastInput)) {

                if (this.config.debug) {
                    const direction = isShiftKey ? '前のタブへ' : '次のタブへ';
                    console.log(`タブ境界でのTab: ${direction}`);
                }

                // タブの最初/最後の要素の場合
                if (isShiftKey && isFirstInput) {
                    // 最初の要素でShift+Tab
                    if (this.isFirstTab(tabId)) {
                        // 最初のタブの場合は前のセクションへ（デフォルト動作を使用）
                    } else {
                        // 前のタブへ移動
                        const prevTabId = this.getPrevTabId(tabId);
                        if (prevTabId && this.config.callbacks.onTabChange) {
                            this.config.callbacks.onTabChange('prev', tabId, prevTabId);
                            event.preventDefault();
                            event.stopImmediatePropagation(); // 伝播を完全に停止
                            console.log(`Tab: 前のタブ ${prevTabId} へ移動処理を実行`);
                            return true;
                        }
                    }
                } else if (!isShiftKey && isLastInput) {
                    // 最後の要素でTab
                    if (this.isLastTab(tabId)) {
                        // 最後のタブの場合は次のセクションへ（デフォルト動作を使用）
                    } else {
                        // 次のタブへ移動
                        const nextTabId = this.getNextTabId(tabId);
                        if (nextTabId && this.config.callbacks.onTabChange) {
                            this.config.callbacks.onTabChange('next', tabId, nextTabId);
                            event.preventDefault();
                            event.stopImmediatePropagation(); // 伝播を完全に停止
                            console.log(`Tab: 次のタブ ${nextTabId} へ移動処理を実行`);
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }
}