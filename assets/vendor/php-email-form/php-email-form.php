<?php 
if(isset($_POST['submit'])){
    $to = "menon.uk1998@gmail.com"; // this is your Email address
    $from_email = $_POST['email']; // this is the sender's Email address
    $from_name = $_POST['name'];
    $subject = $_POST["subject"];
    $message = $from_name . " wrote the following:" . "\n\n" . $_POST['message'];

    $headers = "From:" . $from_email;
    mail($to,$subject,$message,$headers);    
    echo "Mail Sent. Thank you " . $from_name . ", we will contact you shortly.";
    // You can also use header('Location: thank_you.php'); to redirect to another page.
    }
?>

<!DOCTYPE html>
<head>
<title>Form submission</title>
</head>
<body>

<form action="" method="post">
First Name: <input type="text" name="first_name"><br>
Email: <input type="text" name="email"><br>
Message:<br><textarea rows="5" name="message" cols="30"></textarea><br>
<input type="submit" name="submit" value="Submit">
</form>

</body>
</html> 