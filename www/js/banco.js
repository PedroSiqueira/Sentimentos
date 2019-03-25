var db;
function carregarBanco() {
    if (window.cordova.platformId === 'browser') { //o app esta rodando no browser?
        db = window.openDatabase('Sentimentos', '1.0', 'Sentimentos', 2 * 1024 * 1024); //se sim, abre o banco de dados do browser
        console.log('abrindo banco pelo browser');
    } else {
        db = window.sqlitePlugin.openDatabase({name: 'Sentimentos.db', location: 'default'});//senao, abre o banco de dados do android
        console.log('abrindo banco pelo celular');
    }
    //qualquer comando SQL tem que estar dentro de uma transação
    db.transaction(function (tx) {//abrindo uma transação tx
        tx.executeSql("CREATE TABLE IF NOT EXISTS Sentimento ( sentimento TEXT, acontecido TEXT, pensamento TEXT, atitude TEXT, pontuacao INTEGER, quando TEXT);");
    }, function (error) {
        console.log('Transaction ERROR: ' + error.message);
    }, function () {
        console.log("banco carregado!");
        popularTabelas();
        abrir("home");
    });


}

function popularTabelas() {
    db.transaction(function (tx) {
        tx.executeSql('SELECT count(*) AS qtd FROM Sentimento', [], function (tx, rs) {
            if (rs.rows.item(0).qtd === 0) {
                for (var i = 0; i < 50; i++) {
                    tx.executeSql('INSERT INTO Sentimento (sentimento, acontecido, pensamento, atitude, pontuacao, quando) VALUES (?,?,?,?,?,?)', ['sentimento ' + i, 'acontecido ' + i, 'pensamento ' + i, 'atitude ' + i, getRandomIntInclusive(-100, 100), randomDate('2018-01-01', '2018-12-31').toISOString().substr(0, 10)]);
                }
                console.log('tabelas populadas!');
            }
        });
    });
}

function salvar_registro() {
    var sentimento = [$('#sentimento').val(), $('#acontecido').val(), $('#pensamento').val(), $('#atitude').val(), $('#pontuacao').val(), $('#quando').val()];
    db.transaction(function (transaction) {
        transaction.executeSql('INSERT INTO Sentimento (sentimento, acontecido, pensamento, atitude, pontuacao, quando) VALUES (?,?,?,?,?,?)', sentimento);
    }, function (error) {
        console.log('Transaction ERROR: ' + error.message);
    }, function () {
        console.log('inserido ' + sentimento + ' no banco!');
        carregar_sentimentos();
    });
}

function carregar_sentimentos() {
    abrir('sentimentos', {sentimentos: [], paginacao: 0, cor: 'red'}).then(function () {
        carregar_mais_sentimentos();
    });
}

function carregar_mais_sentimentos() {
    db.transaction(function (tx) {
        var limite = 5;
        var offset = myVue.paginacao ? myVue.paginacao : 0;

        tx.executeSql("SELECT acontecido, pontuacao, quando, rowid FROM Sentimento ORDER BY quando DESC LIMIT ? OFFSET ?;", [limite, offset], function (tx, resultSet) {
            if (resultSet.rows.length <= 0)
                return;
            for (var i = 0; i < resultSet.rows.length; i++) {
                myVue.sentimentos.push(resultSet.rows.item(i));
            }
            myVue.paginacao += limite;
        });
    });
}