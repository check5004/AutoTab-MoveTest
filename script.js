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
        // タブコンテンツに関するセレクタ/クラス名
        tabContentSelector: {
            // タブセクションのセレクタ
            tabPane: '.tab-pane',
            // アクティブなタブのクラス
            activeClass: 'active',
        },
        callbacks: {
            // タブ切り替えコールバック
            onTabChange: function(direction, fromTabId, toTabId) {
                console.log(`タブ切り替え: ${direction} ${fromTabId} -> ${toTabId}`);

                // タブが切り替わる前に、予め要素を取得しておく（非表示状態でも取得可能）
                let targetInput = null;

                if (direction === 'next') {
                    // 次へ移動の場合：最初の有効な入力を事前に特定
                    const allInputs = Array.from(document.querySelectorAll(`#${toTabId} .tab-input`))
                        .filter(input => !input.disabled);
                    targetInput = allInputs.length > 0 ? allInputs[0] : null;
                } else {
                    // 前へ移動の場合：最後の有効な入力を事前に特定
                    const allInputs = Array.from(document.querySelectorAll(`#${toTabId} .tab-input`))
                        .filter(input => !input.disabled);
                    targetInput = allInputs.length > 0 ? allInputs[allInputs.length - 1] : null;
                }

                // 現在のタブを非表示に
                $(`#${fromTabId}`).removeClass('active');

                // 次のタブを表示
                $(`#${toTabId}`).addClass('active');

                // タブボタンの状態も更新
                $(`#${fromTabId}-tab`).removeClass('active');
                $(`#${toTabId}-tab`).addClass('active');

                // 適切な要素にフォーカス
                if (targetInput) {
                    // タブ表示更新とフォーカスのタイミングを少し分ける
                    setTimeout(() => {
                        if (direction === 'next') {
                            console.log(`次のタブの最初の要素にフォーカス: ${targetInput.id}`);
                        } else {
                            console.log(`前のタブの最後の要素にフォーカス: ${targetInput.id}`);
                        }
                        targetInput.focus();
                    }, 50);
                } else {
                    console.log(`警告: ${toTabId} 内に有効な入力要素が見つかりません`);
                }
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

    /**
     * タブが表示されたときのイベント処理
     */
    $('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
        // タブ切り替え時の処理を記録
        console.log('タブ切り替えイベント: ' + $(e.target).attr('id') + ' へ切り替え');

        // 表示されたタブの最初の有効な入力フィールドにフォーカス
        const tabId = $(e.target).attr('data-bs-target');
        if (tabId) {
            setTimeout(() => {
                const firstEnabledInput = $(tabId).find('.tab-input').not(':disabled').first();
                if (firstEnabledInput.length) {
                    firstEnabledInput.focus();
                    console.log('タブ切り替え後のフォーカス: ' + firstEnabledInput.attr('id'));
                }
            }, 50); // 少し遅延を入れてDOMの更新を待つ
        }
    });

    /**
     * タブボタンのクリックイベント処理
     */
    $('.nav-tabs .nav-link').on('click', function() {
        // Bootstrapのタブ機能を使用するため、ここでのカスタム切り替え処理は削除
        // フォーカス管理のみを行う
        const targetTabId = $(this).attr('data-bs-target').substring(1); // #を削除

        // フォーカス処理はBootstrapのイベントを使って行う方が適切
        console.log(`タブボタンがクリックされました: ${targetTabId}`);
    });

    /**
     * リセットボタンのイベント処理
     */
    $('#resetBtn').on('click', function() {
        // すべての入力をクリア
        allInputs.val('');

        // 最初のタブに戻る
        $('.tab-pane').removeClass('show active').hide();
        $('#tab1').addClass('show active').show();
        $('.nav-tabs .nav-link').removeClass('active');
        $('#tab1-tab').addClass('active');

        // 現在のパターンを再適用
        const pattern = $('#patternSelect').val();
        applyPattern(pattern);
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