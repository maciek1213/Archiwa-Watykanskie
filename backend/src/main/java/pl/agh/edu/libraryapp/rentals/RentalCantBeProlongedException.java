package pl.agh.edu.libraryapp.rentals;

public class RentalCantBeProlongedException extends RuntimeException {
    public RentalCantBeProlongedException(String message) {
        super(message);
    }
}
