package pl.agh.edu.libraryapp.bookQueue;

public class QueueNotFoundException extends RuntimeException {
    public QueueNotFoundException(String message) {
        super(message);
    }
}