$(document).ready(function() {
    /**
     * Bootstrapタブの初期化 - 修正：buttonタグを使用するように変更
     */
    var tabEl = document.querySelector('button[data-bs-toggle="tab"]');
    var tab = new bootstrap.Tab(tabEl);

    /**
     * 全ての入力要素を取得
     */
    const allInputs = $('.tab-input');

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
                disableRandomInputsInTab('tab1', 2);
                disableRandomInputsInTab('tab2', 3);
                disableRandomInputsInTab('tab3', 3);
                break;
            case '2':
                // パターン2: 各タブからランダムな数の入力フィールドを無効化
                disableRandomInputsInTab('tab1', Math.floor(Math.random() * 3) + 1);
                disableRandomInputsInTab('tab2', Math.floor(Math.random() * 3) + 1);
                disableRandomInputsInTab('tab3', Math.floor(Math.random() * 3) + 1);
                break;
            case '3':
                // パターン3: 各タブの特定の位置の入力フィールドを無効化
                $('#tab1-input2, #tab1-input5, #tab2-input3, #tab3-input1').prop('disabled', true)
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
     * @param {string} tabId - 対象となるタブのID
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
     * @param {string} inputId - 対象となる入力フィールドのID
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
     * キーダウンイベントを監視して、Tab/Enterキーの動作をカスタマイズ
     */
    $(document).on('keydown', '.tab-input', function(e) {
        const inputs = $('.tab-input').not(':disabled');
        const currentIndex = inputs.index(this);
        const lastIndex = inputs.length - 1;

        // Enterキーが押された場合
        if (e.key === 'Enter') {
            e.preventDefault();

            // Shiftキーと一緒に押された場合は前の入力へ
            if (e.shiftKey) {
                if (currentIndex > 0) {
                    inputs.eq(currentIndex - 1).focus();
                } else {
                    // 先頭の場合は最後の入力にループ
                    inputs.eq(lastIndex).focus();
                }
            } else {
                // 次の入力へ
                if (currentIndex < lastIndex) {
                    inputs.eq(currentIndex + 1).focus();
                } else {
                    // 最後の場合は先頭の入力にループ
                    inputs.eq(0).focus();
                }
            }
        }
    });

    /**
     * タブが表示されたときのイベント処理
     */
    $('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
        // 表示されたタブの最初の有効な入力フィールドにフォーカス
        const tabId = $(e.target).data('bs-target');
        if (tabId) {
            const firstEnabledInput = $(tabId).find('.tab-input').not(':disabled').first();
            if (firstEnabledInput.length) {
                firstEnabledInput.focus();
            }
        }
    });

    /**
     * リセットボタンのイベント処理
     */
    $('#resetBtn').on('click', function() {
        // すべての入力をクリア
        allInputs.val('');

        // 最初のタブに戻る
        const firstTabElement = document.querySelector('#tab1-tab');
        if (firstTabElement) {
            const firstTab = new bootstrap.Tab(firstTabElement);
            firstTab.show();
        }

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