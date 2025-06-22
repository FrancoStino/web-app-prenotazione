<?php
$dati = file_get_contents('php://input');
$dati = json_decode($dati);
//Modifico il nome solo per vedere che funziona e restituisco i dati in formato json
// $dati->nome = "Luisa";
echo json_encode($dati);
