<?php
require_once 'vendor/autoload.php';

function logError($message) {
    $logFile = getenv('ERROR_LOG_FILE');
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

set_error_handler(function($severity, $message, $file, $line) {
    logError("Error: [$severity] $message in $file on line $line");
});

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// update this regularly
// TODO: consider better security, but at least ensure SSL protected wherever this is hosted
$apiSecret = getenv('API_SECRET');
$ipStorageFile = getenv('IP_STORAGE_FILE');

$headers = apache_request_headers();

if (!isset($headers['Authorization'])) {
    http_response_code(401);
    die("No token provided");
}

list($token) = sscanf($headers['Authorization'], "Bearer %s");
if ($token !== $apiSecret) {
    http_response_code(401);
    die("Invalid token");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ipAddress = $_POST['ip_address'] ?? '';
    if (!filter_var($ipAddress, FILTER_VALIDATE_IP)) {
        http_response_code(400);
        die("Invalid IP address");
    }
    file_put_contents($ipStorageFile, $ipAddress);
    http_response_code(200);
    echo "IP address updated successfully";
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($ipStorageFile)) {
        http_response_code(200);
        echo file_get_contents($ipStorageFile);
    } else {
        http_response_code(404);
        echo "No IP address stored";
    }
} else {
    http_response_code(405);
    echo "Unsupported method";
}
?>
