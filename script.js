$(document).ready(function() {
    /**
     * Bootstrapタブの初期化 - すべてのタブボタンを正しく初期化
     */
    // 個別のタブ要素を初期化するのではなく、Bootstrapの標準機能を使用
    // Bootstrap 5ではタブは自動的に初期化されるため、明示的な初期化は不要です

    /**
     * 全ての入力要素を取得
     */
    const allInputs = $('.tab-input');

    /**
     * タブナビゲーション機能の初期化
     * 注意: CommonModule.jsが先に読み込まれていることを前提にしています
     */
    const tabNav = new TabNavigationUtil();

    // コールバック関数を使ってタブ切り替えを実装
    tabNav.initialize({
        debug: true, // デバッグ出力を有効化
        // 入力フィールドのセレクタを設定
        inputSelector: '.tab-input:not(:disabled)',
        // タブナビゲーションの挙動設定
        behavior: {
            // 前のタブに移動する際、最後の要素にフォーカスする（falseの場合は最初の要素）
            focusLastElementOnPrevTab: true,
        },
        callbacks: {
            // タブ切り替えコールバック
            onTabChange: function(direction, fromTabId, toTabId) {
                console.log(`タブナビゲーション: ${direction} ${fromTabId} -> ${toTabId}`);

                // タブの表示切り替え処理
                // 現在のタブを非表示に
                $(`#${fromTabId}`).removeClass('active show');

                // 次のタブを表示
                $(`#${toTabId}`).addClass('active show');

                // タブボタンの状態も更新
                $(`#${fromTabId}-tab`).removeClass('active');
                $(`#${toTabId}-tab`).addClass('active');

                // フォーカス処理はTabNavigationUtilが担当
            }
        }
    });

    console.log('スクリプト初期化完了: タブナビゲーションがキャプチャフェーズで登録されました');

    /**
     * パターン選択が変更されたときの処理
     */
    $('#patternSelect').on('change', function() {
        const pattern = $(this).val();
        applyPattern(pattern);
    });

    // 初期状態でパターン1を適用
    applyPattern('1');

    /**
     * パターンに基づいて入力フィールドの有効/無効を設定する関数
     * @param {string} pattern - 適用するパターンの識別子
     */
    function applyPattern(pattern) {
        // すべての入力フィールドをリセットし、ステータス表示をクリア
        allInputs.prop('disabled', false);
        $('.input-status').text('');

        // パターンに基づいてランダムに入力フィールドを無効化
        switch(pattern) {
            case '1':
                // パターン1: 各タブから1つずつランダムに無効化
                disableRandomInputsInTab('tab1', 1);
                disableRandomInputsInTab('tab2', 1);
                disableRandomInputsInTab('tab3', 1);
                break;
            case '2':
                // パターン2: 各タブからランダムな数の入力フィールドを無効化
                disableRandomInputsInTab('tab1', Math.floor(Math.random() * 3) + 1);
                disableRandomInputsInTab('tab2', Math.floor(Math.random() * 3) + 1);
                disableRandomInputsInTab('tab3', Math.floor(Math.random() * 3) + 1);
                break;
            case '3':
                // パターン3: 各タブの特定の位置の入力フィールドを無効化
                $('#tab1-input2, #tab2-input3, #tab3-input4').prop('disabled', true)
                    .each(function() {
                        updateInputStatus($(this).attr('id'), true);
                    });
                break;
        }

        // 無効なフィールドのステータスを更新
        allInputs.each(function() {
            if ($(this).prop('disabled')) {
                updateInputStatus($(this).attr('id'), true);
            }
        });

        // フォーカス可能な最初の入力フィールドにフォーカスを設定
        const firstEnabledInput = allInputs.not(':disabled').first();
        if (firstEnabledInput.length) {
            firstEnabledInput.focus();
        }
    }

    /**
     * 指定されたタブ内でランダムに入力フィールドを無効化する関数
     * @param {string} tabId - 対象のタブID
     * @param {number} count - 無効化する入力フィールドの数
     */
    function disableRandomInputsInTab(tabId, count) {
        const inputs = $(`#${tabId} .tab-input`);
        const indices = [];

        // すべてのインデックスを配列に追加
        for (let i = 0; i < inputs.length; i++) {
            indices.push(i);
        }

        // Fisher-Yates シャッフルアルゴリズムでインデックスをシャッフル
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // 指定された数の入力フィールドを無効化
        for (let i = 0; i < Math.min(count, indices.length); i++) {
            const input = $(inputs[indices[i]]);
            input.prop('disabled', true);
            updateInputStatus(input.attr('id'), true);
        }
    }

    /**
     * 入力フィールドのステータス表示を更新する関数
     * @param {string} inputId - 入力フィールドのID
     * @param {boolean} isDisabled - 無効状態かどうか
     */
    function updateInputStatus(inputId, isDisabled) {
        const statusElement = $(`#${inputId}-status`);
        if (isDisabled) {
            statusElement.text('このフィールドは現在のパターンでは入力できません');
        } else {
            statusElement.text('');
        }
    }

    // Bootstrap互換のタブイベントをリッスンしてフォーカス処理を実行
    // 注：この機能はタブナビゲーションからの切り替えではなく、通常のタブクリック操作用
    $('a[data-toggle="tab"], button[data-tab-target]').on('shown.bs.tab', function (e) {
        // preventDefault()を使用しているため通常は実行されないが、
        // 他の方法でBootstrapタブが起動された場合にフォーカス処理を行う
        const toTabId = $(e.target).attr('data-tab-target') || $(e.target).attr('href');

        if (toTabId) {
            console.log(`タブ切り替えイベント検出: to=${toTabId}`);

            // フォーカス処理はカスタム実装と同じ手法を使用
            setTimeout(() => {
                const firstEnabledInput = $(`${toTabId} .tab-input:not(:disabled)`).first();
                if (firstEnabledInput.length) {
                    firstEnabledInput.focus();
                    console.log('標準タブ切り替え後のフォーカス: ' + firstEnabledInput.attr('id'));
                }
            }, 50);
        }
    });

    /**
     * タブボタンのクリックイベント処理
     */
    $('.nav-tabs .nav-link').on('click', function(e) {
        // デバッグ：ボタン要素の詳細を出力
        console.log('クリックされたタブボタン:', this);
        console.log('属性 data-tab-target:', $(this).attr('data-tab-target'));
        console.log('属性 href:', $(this).attr('href'));
        console.log('属性 id:', $(this).attr('id'));

        // ターゲットのタブパネルを取得（独自属性data-tab-targetを優先）
        let target = $(this).attr('data-tab-target') || $(this).attr('href');

        // もしターゲットが見つからない場合は、id属性から推測する
        if (!target) {
            const btnId = $(this).attr('id');
            if (btnId && btnId.endsWith('-tab')) {
                const tabId = btnId.replace('-tab', '');
                target = `#${tabId}`;
                console.log(`ターゲットをID ${btnId} から推測: ${target}`);
            }
        }

        if (target) {
            // 現在のタブIDを取得
            const currentTab = $('.tab-pane.active').attr('id');
            const targetTabId = target.substring(1); // #を削除

            console.log(`タブ切り替え: ${currentTab || '不明'} -> ${targetTabId}`);

            // カスタムタブ切り替え
            // 全てのタブパネルを非アクティブに
            $('.tab-pane').removeClass('active show');
            $('.nav-tabs .nav-link').removeClass('active');

            // 対象のタブパネルとタブボタンをアクティブに
            $(target).addClass('active show');
            $(this).addClass('active');

            // フォーカス処理
            setTimeout(() => {
                const firstEnabledInput = $(`${target} .tab-input:not(:disabled)`).first();
                if (firstEnabledInput.length) {
                    firstEnabledInput.focus();
                    console.log('タブ切り替え後のフォーカス: ' + firstEnabledInput.attr('id'));
                } else {
                    console.log(`警告: タブ ${targetTabId} 内に有効な入力要素が見つかりません`);
                }
            }, 50);

            // デフォルト動作を防ぐためイベントをキャンセル
            e.preventDefault();
        } else {
            console.log('エラー: タブボタンのターゲットが見つかりません');
            console.log('クリックされた要素:', this);
        }
    });

    /**
     * リセットボタンのイベント処理
     */
    $('#resetBtn').on('click', function() {
        // すべての入力をクリア
        allInputs.val('');

        // 最初のタブに戻る
        $('.tab-pane').removeClass('active show');
        $('#tab1').addClass('active show');
        $('.nav-tabs .nav-link').removeClass('active');
        $('#tab1-tab').addClass('active');

        // 最初のタブの最初の入力フィールドにフォーカス
        setTimeout(() => {
            const firstEnabledInput = $('#tab1 .tab-input:not(:disabled)').first();
            if (firstEnabledInput.length) {
                firstEnabledInput.focus();
                console.log('リセット後のフォーカス: ' + firstEnabledInput.attr('id'));
            }
        }, 50);

        // 現在のパターンを再適用
        const pattern = $('#patternSelect').val();
        if (pattern) {
            applyPattern(pattern);
        }
    });

    /**
     * 送信ボタンのイベント処理
     */
    $('#submitBtn').on('click', function() {
        // 入力値の収集
        const values = {};

        // 有効な入力フィールドの値を収集
        allInputs.not(':disabled').each(function() {
            values[$(this).attr('id')] = $(this).val();
        });

        // 入力内容のサマリーを作成
        let summary = '<h4>入力データサマリー：</h4><ul>';
        $.each(values, function(id, value) {
            if (value) {
                summary += `<li><strong>${id}</strong>: ${value}</li>`;
            }
        });
        summary += '</ul>';

        // モーダルダイアログでの表示を代わりに実装（未実装）
        console.log('送信データ:', values);
        alert('データが送信されました！コンソールを確認してください。');
    });
});