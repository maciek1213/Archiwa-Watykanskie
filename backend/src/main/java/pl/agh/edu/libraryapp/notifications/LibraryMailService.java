package pl.agh.edu.libraryapp.notifications;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class LibraryMailService{

    private final JavaMailSender mailSender;
    @Value("${mail.from}")
    private String from;
    public LibraryMailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendMail(String subject, String body, String to) {
        SimpleMailMessage message = new SimpleMailMessage();

        System.out.println(to);
        System.out.println(from);

        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom(from);
        mailSender.send(message);
    }
}
