package pl.agh.edu.libraryapp.config;

import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.*;
import pl.agh.edu.libraryapp.book.repositories.*;
import pl.agh.edu.libraryapp.bookItem.BookItem;
import pl.agh.edu.libraryapp.bookItem.BookItemRepository;
import pl.agh.edu.libraryapp.rentals.Rentals;
import pl.agh.edu.libraryapp.rentals.RentalsRepository;
import pl.agh.edu.libraryapp.review.Review;
import pl.agh.edu.libraryapp.review.ReviewRepository;
import pl.agh.edu.libraryapp.user.User;
import pl.agh.edu.libraryapp.user.Role;
import pl.agh.edu.libraryapp.user.RoleRepository;
import pl.agh.edu.libraryapp.user.UserRepository;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DatabaseSeederService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final BookItemRepository bookItemRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RentalsRepository rentalsRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReviewRepository reviewRepository;

    @Transactional
    public void seedManualBooks() {
        createBookIfNotFound("Wiedźmin: Ostatnie życzenie", "Andrzej Sapkowski", 2, List.of("Fantasy", "Klasyka"));
        createBookIfNotFound("Solaris", "Stanisław Lem", 20, List.of("Sci-Fi", "Filozofia"));
        createBookIfNotFound("Lalka", "Bolesław Prus", 20, List.of("Klasyka", "Literatura Polska"));
        createBookIfNotFound("Sherlock Holmes: Studium w szkarłacie", "Arthur Conan Doyle", 20, List.of("Kryminał"));
        createBookIfNotFound("Władca Pierścieni: Drużyna Pierścienia", "J.R.R. Tolkien", 20, List.of("Fantasy"));
        createBookIfNotFound("Potop", "Henryk Sienkiewicz", 22, List.of("Klasyka", "Historyczna"));
        createBookIfNotFound("Quo Vadis", "Henryk Sienkiewicz", 18, List.of("Klasyka", "Historyczna"));
        createBookIfNotFound("Pan Tadeusz", "Adam Mickiewicz", 30, List.of("Klasyka", "Poezja"));
        createBookIfNotFound("Ferdydurke", "Witold Gombrowicz", 16, List.of("Klasyka", "Literatura Polska"));
        createBookIfNotFound("Granica", "Zofia Nałkowska", 15, List.of("Klasyka", "Literatura Polska"));
        createBookIfNotFound("Chłopi", "Władysław Reymont", 25, List.of("Klasyka", "Nobel"));

        createBookIfNotFound("Miecz Przeznaczenia", "Andrzej Sapkowski", 28, List.of("Fantasy"));
        createBookIfNotFound("Krew Elfów", "Andrzej Sapkowski", 27, List.of("Fantasy"));
        createBookIfNotFound("Hobbit, czyli tam i z powrotem", "J.R.R. Tolkien", 29, List.of("Fantasy"));
        createBookIfNotFound("Dwie Wieże", "J.R.R. Tolkien", 24, List.of("Fantasy"));
        createBookIfNotFound("Powrót Króla", "J.R.R. Tolkien", 24, List.of("Fantasy"));
        createBookIfNotFound("Cyberiada", "Stanisław Lem", 19, List.of("Sci-Fi", "Filozofia"));
        createBookIfNotFound("Bajki Robotów", "Stanisław Lem", 21, List.of("Sci-Fi"));
        createBookIfNotFound("Diuna", "Frank Herbert", 26, List.of("Sci-Fi"));
        createBookIfNotFound("Gra o Tron", "George R.R. Martin", 28, List.of("Fantasy"));
        createBookIfNotFound("Starcie Królów", "George R.R. Martin", 22, List.of("Fantasy"));
        createBookIfNotFound("Fundacja", "Isaac Asimov", 17, List.of("Sci-Fi"));
        createBookIfNotFound("Blade Runner: Czy androidy śnią o elektrycznych owcach?", "Philip K. Dick", 20, List.of("Sci-Fi"));

        createBookIfNotFound("Morderstwo w Orient Expressie", "Agatha Christie", 23, List.of("Kryminał"));
        createBookIfNotFound("I nie było już nikogo", "Agatha Christie", 22, List.of("Kryminał"));
        createBookIfNotFound("Kasacja", "Remigiusz Mróz", 26, List.of("Kryminał", "Thriller prawniczy"));
        createBookIfNotFound("Zaginięcie", "Remigiusz Mróz", 25, List.of("Kryminał", "Thriller prawniczy"));
        createBookIfNotFound("Pochłaniacz", "Katarzyna Bonda", 19, List.of("Kryminał"));
        createBookIfNotFound("Okularnik", "Katarzyna Bonda", 18, List.of("Kryminał"));
        createBookIfNotFound("Ziarno prawdy", "Zygmunt Miłoszewski", 21, List.of("Kryminał"));
        createBookIfNotFound("Uwikłanie", "Zygmunt Miłoszewski", 20, List.of("Kryminał"));
        createBookIfNotFound("Pierwszy śnieg", "Jo Nesbo", 24, List.of("Thriller", "Kryminał"));

        createBookIfNotFound("Kod Leonarda da Vinci", "Dan Brown", 30, List.of("Thriller", "Sensacja"));
        createBookIfNotFound("Anioły i Demony", "Dan Brown", 27, List.of("Thriller", "Sensacja"));
        createBookIfNotFound("Bieguni", "Olga Tokarczuk", 22, List.of("Literatura Współczesna", "Nobel"));
        createBookIfNotFound("Księgi Jakubowe", "Olga Tokarczuk", 17, List.of("Historyczna", "Nobel"));
        createBookIfNotFound("Rok 1984", "George Orwell", 29, List.of("Dystopia", "Klasyka"));
        createBookIfNotFound("Folwark zwierzęcy", "George Orwell", 28, List.of("Klasyka", "Satyra"));
        createBookIfNotFound("Mały Książę", "Antoine de Saint-Exupéry", 30, List.of("Bajka", "Filozofia"));
        createBookIfNotFound("Alchemik", "Paulo Coelho", 24, List.of("Literatura Współczesna"));
        createBookIfNotFound("Cień wiatru", "Carlos Ruiz Zafón", 26, List.of("Literatura Współczesna", "Tajemnica"));

        createBookIfNotFound("Gra w klasy", "Julio Cortazar", 15, List.of("Klasyka"));
        createBookIfNotFound("Sto lat samotności", "Gabriel García Márquez", 19, List.of("Realizm Magiczny"));
        createBookIfNotFound("Stary człowiek i morze", "Ernest Hemingway", 21, List.of("Klasyka"));
        createBookIfNotFound("Cesarz", "Ryszard Kapuściński", 18, List.of("Reportaż"));
        createBookIfNotFound("Heban", "Ryszard Kapuściński", 20, List.of("Reportaż"));
        createBookIfNotFound("Steve Jobs", "Walter Isaacson", 23, List.of("Biografia"));
        createBookIfNotFound("Sapiens: Od zwierząt do bogów", "Yuval Noah Harari", 25, List.of("Popularnonaukowa"));
        createBookIfNotFound("Zanim wystygnie kawa", "Toshikazu Kawaguchi", 28, List.of("Literatura Japońska"));
        createBookIfNotFound("Shantaram", "Gregory David Roberts", 21, List.of("Przygoda", "Literatura Współczesna"));

        createBookIfNotFound("Manifest Komunistyczny", "Karol Marks, Fryderyk Engels", 20, List.of("Polityka", "Filozofia"));
        createBookIfNotFound("Mein Kampf", "Adolf Hitler", 15, List.of("Historyczna", "Polityka")); // Pozycja kontrowersyjna/historyczna
        createBookIfNotFound("Manifest z Ventotene", "Altiero Spinelli", 18, List.of("Polityka", "Unia Europejska"));
        createBookIfNotFound("Manifest surrealizmu", "André Breton", 22, List.of("Sztuka", "Manifest"));
        createBookIfNotFound("O wolności", "John Stuart Mill", 25, List.of("Filozofia", "Polityka"));
        createBookIfNotFound("Umowa społeczna", "Jean-Jacques Rousseau", 19, List.of("Filozofia"));
        createBookIfNotFound("Państwo", "Platon", 30, List.of("Filozofia", "Antyk"));
        createBookIfNotFound("Książę", "Niccolò Machiavelli", 28, List.of("Polityka", "Filozofia"));
        createBookIfNotFound("Lewiatan", "Thomas Hobbes", 17, List.of("Filozofia", "Polityka"));
        createBookIfNotFound("Kapitał", "Karol Marks", 16, List.of("Ekonomia", "Polityka"));
        createBookIfNotFound("Bunt mas", "José Ortega y Gasset", 21, List.of("Socjologia", "Filozofia"));
        createBookIfNotFound("Anarchia, państwo i utopia", "Robert Nozick", 15, List.of("Filozofia", "Polityka"));
        createBookIfNotFound("Droga do zniewolenia", "Friedrich Hayek", 24, List.of("Ekonomia", "Polityka"));
        createBookIfNotFound("Teoria sprawiedliwości", "John Rawls", 18, List.of("Filozofia", "Prawo"));
        createBookIfNotFound("O wojnie", "Carl von Clausewitz", 20, List.of("Militaria", "Strategia"));
        createBookIfNotFound("Sztuka wojny", "Sun Tzu", 30, List.of("Filozofia", "Strategia"));
        createBookIfNotFound("Mistyczny manifest", "Salvador Dalí", 16, List.of("Sztuka", "Manifest"));
        createBookIfNotFound("Manifest futurystyczny", "Filippo Tommaso Marinetti", 19, List.of("Sztuka", "Manifest"));
        createBookIfNotFound("Źródła totalitaryzmu", "Hannah Arendt", 21, List.of("Polityka", "Historia"));
        createBookIfNotFound("Ucieczka od wolności", "Erich Fromm", 25, List.of("Psychologia", "Socjologia"));
        createBookIfNotFound("Kultura lęku", "Frank Furedi", 17, List.of("Socjologia"));
        createBookIfNotFound("Koniec historii", "Francis Fukuyama", 19, List.of("Polityka", "Historia"));
        createBookIfNotFound("Zderzenie cywilizacji", "Samuel Huntington", 23, List.of("Polityka", "Socjologia"));
        createBookIfNotFound("Nowy wspaniały świat", "Aldous Huxley", 29, List.of("Dystopia", "Filozofia"));

        createBookIfNotFound("Pismo Święte Starego i Nowego Testamentu", "Praca zbiorowa", 30, List.of("Religia", "Chrześcijaństwo"));
        createBookIfNotFound("Koran", "Praca zbiorowa", 25, List.of("Religia", "Islam"));
        createBookIfNotFound("Tora", "Praca zbiorowa", 20, List.of("Religia", "Judaizm"));
        createBookIfNotFound("Bhagawadgita", "Praca zbiorowa", 18, List.of("Religia", "Hinduizm"));
        createBookIfNotFound("Dhammapada", "Praca zbiorowa", 17, List.of("Religia", "Buddyzm"));
        createBookIfNotFound("Księga Mormona", "Joseph Smith", 16, List.of("Religia"));
        createBookIfNotFound("Tao Te Ching", "Laozi", 22, List.of("Filozofia", "Taoizm"));
        createBookIfNotFound("O naśladowaniu Chrystusa", "Tomasz à Kempis", 24, List.of("Duchowość", "Chrześcijaństwo"));
        createBookIfNotFound("Wyznania", "Święty Augustyn", 21, List.of("Religia", "Filozofia"));
        createBookIfNotFound("Tybetańska Księga Umarłych", "Padmasambhava", 15, List.of("Religia", "Buddyzm"));
        createBookIfNotFound("Duchowość bez religii", "Sam Harris", 19, List.of("Filozofia", "Duchowość"));
        createBookIfNotFound("Potęga teraźniejszości", "Eckhart Tolle", 28, List.of("Duchowość", "Rozwój osobisty"));
        createBookIfNotFound("Rozmowy z Bogiem", "Neale Donald Walsch", 23, List.of("Duchowość"));
        createBookIfNotFound("Przesłanie", "Dalajlama", 20, List.of("Buddyzm", "Duchowość"));
        createBookIfNotFound("Zohar", "Szymon bar Jochaj", 15, List.of("Religia", "Kabała"));

        createBookIfNotFound("Harry Potter i Kamień Filozoficzny", "J.K. Rowling", 30, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Harry Potter i Komnata Tajemnic", "J.K. Rowling", 28, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Harry Potter i Więzień Azkabanu", "J.K. Rowling", 28, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Harry Potter i Czara Ognia", "J.K. Rowling", 28, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Harry Potter i Zakon Feniksa", "J.K. Rowling", 28, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Harry Potter i Książę Półkrwi", "J.K. Rowling", 28, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Harry Potter i Insygnia Śmierci", "J.K. Rowling", 30, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Pucio uczy się mówić", "Marta Galewska-Kustra", 25, List.of("Dla dzieci", "Edukacja"));
        createBookIfNotFound("Pucio mówi pierwsze słowa", "Marta Galewska-Kustra", 25, List.of("Dla dzieci", "Edukacja"));
        createBookIfNotFound("Dziennik Cwaniaczka", "Jeff Kinney", 22, List.of("Dla dzieci", "Humor"));
        createBookIfNotFound("Kubuś Puchatek", "A.A. Milne", 30, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Chatka Puchatka", "A.A. Milne", 26, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Akademia Pana Kleksa", "Jan Brzechwa", 29, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Podróże Pana Kleksa", "Jan Brzechwa", 24, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Dzieci z Bullerbyn", "Astrid Lindgren", 30, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Pippi Pończoszanka", "Astrid Lindgren", 27, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Mikołajek", "René Goscinny", 28, List.of("Dla dzieci", "Humor"));
        createBookIfNotFound("Nowe przygody Mikołajka", "René Goscinny", 25, List.of("Dla dzieci", "Humor"));
        createBookIfNotFound("Opowieści z Narnii: Lew, Czarownica i stara szafa", "C.S. Lewis", 29, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Opowieści z Narnii: Książę Kaspian", "C.S. Lewis", 24, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Koralina", "Neil Gaiman", 21, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Charlie i fabryka czekolady", "Roald Dahl", 26, List.of("Dla dzieci", "Fantasy"));
        createBookIfNotFound("Matylda", "Roald Dahl", 23, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Muminki: W dolinie Muminków", "Tove Jansson", 28, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Lato Muminków", "Tove Jansson", 25, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Zima Muminków", "Tove Jansson", 22, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("O psie, który jeździł koleją", "Roman Pisarski", 30, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Anaruk, chłopiec z Grenlandii", "Czesław Centkiewicz", 26, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Zaczarowana zagroda", "Alina i Czesław Centkiewiczowie", 25, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Plastusiowy pamiętnik", "Maria Kownacka", 27, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Karolcia", "Maria Krüger", 23, List.of("Dla dzieci", "Klasyka"));
        createBookIfNotFound("Ten obcy", "Irena Jurgielewiczowa", 25, List.of("Młodzieżowa", "Klasyka"));
        createBookIfNotFound("Kamienie na szaniec", "Aleksander Kamiński", 30, List.of("Młodzieżowa", "Historyczna"));
        createBookIfNotFound("Percy Jackson: Złodziej Pioruna", "Rick Riordan", 27, List.of("Młodzieżowa", "Fantasy"));
        createBookIfNotFound("Percy Jackson: Morze Potworów", "Rick Riordan", 24, List.of("Młodzieżowa", "Fantasy"));
        createBookIfNotFound("Igrzyska Śmierci", "Suzanne Collins", 29, List.of("Młodzieżowa", "Dystopia"));
        createBookIfNotFound("W pierścieniu ognia", "Suzanne Collins", 26, List.of("Młodzieżowa", "Dystopia"));
        createBookIfNotFound("Kosogłos", "Suzanne Collins", 26, List.of("Młodzieżowa", "Dystopia"));
        createBookIfNotFound("Niezgodna", "Veronica Roth", 22, List.of("Młodzieżowa", "Dystopia"));
        createBookIfNotFound("Gwiazd naszych wina", "John Green", 25, List.of("Młodzieżowa", "Romantyczna"));

        createBookIfNotFound("It Ends with Us", "Colleen Hoover", 30, List.of("Romantyczna", "Współczesna"));
        createBookIfNotFound("It Starts with Us", "Colleen Hoover", 29, List.of("Romantyczna", "Współczesna"));
        createBookIfNotFound("Verity", "Colleen Hoover", 27, List.of("Thriller", "Romantyczna"));
        createBookIfNotFound("Normalni ludzie", "Sally Rooney", 24, List.of("Współczesna"));
        createBookIfNotFound("Gdzie śpiewają raki", "Delia Owens", 28, List.of("Współczesna", "Tajemnica"));
        createBookIfNotFound("Siedmiu mężów Evelyn Hugo", "Taylor Jenkins Reid", 26, List.of("Współczesna", "Dramat"));
        createBookIfNotFound("Daisy Jones & The Six", "Taylor Jenkins Reid", 23, List.of("Współczesna", "Muzyka"));
        createBookIfNotFound("Lekcje chemii", "Bonnie Garmus", 22, List.of("Historyczna", "Współczesna"));
        createBookIfNotFound("Niewidzialne życie Addie LaRue", "V.E. Schwab", 25, List.of("Fantasy", "Romantyczna"));
        createBookIfNotFound("Baśń", "Stephen King", 28, List.of("Fantasy", "Horror"));
        createBookIfNotFound("Instytut", "Stephen King", 24, List.of("Thriller", "Horror"));
        createBookIfNotFound("Outsider", "Stephen King", 23, List.of("Kryminał", "Thriller"));
        createBookIfNotFound("Holly", "Stephen King", 22, List.of("Kryminał"));
        createBookIfNotFound("Empuzjon", "Olga Tokarczuk", 25, List.of("Literatura Piękna"));
        createBookIfNotFound("Czuły narrator", "Olga Tokarczuk", 21, List.of("Eseje"));
        createBookIfNotFound("Życie na pełnej petardzie", "Jan Kaczkowski", 26, List.of("Biografia", "Duchowość"));
        createBookIfNotFound("365 dni", "Blanka Lipińska", 30, List.of("Erotyka", "Bestseller"));
        createBookIfNotFound("Ten dzień", "Blanka Lipińska", 25, List.of("Erotyka"));
        createBookIfNotFound("Kolejne 365 dni", "Blanka Lipińska", 25, List.of("Erotyka"));
        createBookIfNotFound("Chłopki", "Joanna Kuciel-Frydryszak", 30, List.of("Reportaż", "Historia"));
        createBookIfNotFound("Służące do wszystkiego", "Joanna Kuciel-Frydryszak", 24, List.of("Reportaż", "Historia"));
        createBookIfNotFound("Kult", "Łukasz Orbitowski", 18, List.of("Współczesna"));
        createBookIfNotFound("Zanim wystygnie kawa: Opowieści z kawiarni", "Toshikazu Kawaguchi", 27, List.of("Literatura Japońska"));
        createBookIfNotFound("Midnight Library", "Matt Haig", 26, List.of("Fantasy", "Współczesna"));
        createBookIfNotFound("Czwarta małpa", "J.D. Barker", 21, List.of("Thriller"));
        createBookIfNotFound("Pacjentka", "Alex Michaelides", 29, List.of("Thriller", "Kryminał"));
        createBookIfNotFound("Boginie", "Alex Michaelides", 22, List.of("Thriller"));
        createBookIfNotFound("Mentalista", "Camilla Läckberg, Henrik Fexeus", 24, List.of("Kryminał"));
        createBookIfNotFound("Kukułcze jajo", "Camilla Läckberg", 23, List.of("Kryminał"));
        createBookIfNotFound("Srebrne skrzydła", "Camilla Läckberg", 20, List.of("Kryminał"));
        createBookIfNotFound("Zemsta", "Jo Nesbo", 25, List.of("Kryminał"));
        createBookIfNotFound("Królestwo", "Jo Nesbo", 22, List.of("Kryminał"));
        createBookIfNotFound("Klub koneserów zbrodni", "Anders de la Motte", 19, List.of("Kryminał"));
        createBookIfNotFound("Cieszyński Sherlock", "Mariusz Czubaj", 18, List.of("Kryminał"));
        createBookIfNotFound("Kwestia ceny", "Zygmunt Miłoszewski", 21, List.of("Sensacja"));
        createBookIfNotFound("Topiel", "Jakub Ćwiek", 17, List.of("Thriller", "Kryminał"));
        createBookIfNotFound("Nieodgadniona", "Remigiusz Mróz", 26, List.of("Thriller"));
        createBookIfNotFound("Kabalista", "Remigiusz Mróz", 25, List.of("Kryminał"));
        createBookIfNotFound("Werdykt", "Remigiusz Mróz", 25, List.of("Kryminał"));
        createBookIfNotFound("Zarzut", "Remigiusz Mróz", 25, List.of("Kryminał"));
        createBookIfNotFound("Przepaść", "Remigiusz Mróz", 24, List.of("Kryminał"));
        createBookIfNotFound("Mentalista", "Camilla Läckberg", 21, List.of("Kryminał"));
        createBookIfNotFound("Sapiens: Opowieść graficzna", "Yuval Noah Harari", 23, List.of("Popularnonaukowa"));
        createBookIfNotFound("21 lekcji na XXI wiek", "Yuval Noah Harari", 24, List.of("Popularnonaukowa"));
        createBookIfNotFound("Homo deus", "Yuval Noah Harari", 24, List.of("Popularnonaukowa"));
        createBookIfNotFound("Fin finansowy", "Michał Szafrański", 22, List.of("Poradnik", "Finanse"));
        createBookIfNotFound("Bogaty ojciec, biedny ojciec", "Robert Kiyosaki", 28, List.of("Poradnik", "Finanse"));
        createBookIfNotFound("Atomowe nawyki", "James Clear", 30, List.of("Poradnik", "Psychologia"));
        createBookIfNotFound("Psychologia pieniędzy", "Morgan Housel", 26, List.of("Poradnik", "Finanse"));
        createBookIfNotFound("Otoczeni przez idiotów", "Thomas Erikson", 27, List.of("Poradnik", "Psychologia"));

        createBookIfNotFound("Bracia Karamazow", "Fiodor Dostojewski", 19, List.of("Klasyka", "Filozofia"));
        createBookIfNotFound("Zbrodnia i kara", "Fiodor Dostojewski", 28, List.of("Klasyka", "Psychologia"));
        createBookIfNotFound("Idiota", "Fiodor Dostojewski", 17, List.of("Klasyka"));
        createBookIfNotFound("Mistrz i Małgorzata", "Michaił Bułhakow", 29, List.of("Klasyka", "Realizm Magiczny"));
        createBookIfNotFound("Proces", "Franz Kafka", 25, List.of("Klasyka", "Dystopia"));
        createBookIfNotFound("Przemiana", "Franz Kafka", 20, List.of("Klasyka"));
        createBookIfNotFound("Portret Doriana Graya", "Oscar Wilde", 22, List.of("Klasyka"));
        createBookIfNotFound("Wielki Gatsby", "F. Scott Fitzgerald", 24, List.of("Klasyka"));
        createBookIfNotFound("Ulisses", "James Joyce", 15, List.of("Klasyka", "Modernizm"));
        createBookIfNotFound("Pani Dalloway", "Virginia Woolf", 16, List.of("Klasyka"));
        createBookIfNotFound("Komu bije dzwon", "Ernest Hemingway", 21, List.of("Klasyka", "Wojenna"));
        createBookIfNotFound("Na zachodzie bez zmian", "Erich Maria Remarque", 26, List.of("Klasyka", "Wojenna"));
        createBookIfNotFound("Czarodziejska góra", "Thomas Mann", 15, List.of("Klasyka"));
        createBookIfNotFound("Doktor Faustus", "Thomas Mann", 15, List.of("Klasyka"));
        createBookIfNotFound("Duma i uprzedzenie", "Jane Austen", 28, List.of("Klasyka", "Romans"));
        createBookIfNotFound("Rozważna i romantyczna", "Jane Austen", 23, List.of("Klasyka", "Romans"));
        createBookIfNotFound("Wichrowe Wzgórza", "Emily Brontë", 25, List.of("Klasyka", "Romans"));
        createBookIfNotFound("Dziwne losy Jane Eyre", "Charlotte Brontë", 24, List.of("Klasyka"));
        createBookIfNotFound("Hrabia Monte Christo", "Aleksander Dumas", 27, List.of("Klasyka", "Przygoda"));
        createBookIfNotFound("Trzej muszkieterowie", "Aleksander Dumas", 25, List.of("Klasyka", "Przygoda"));
    }

    private void createBookIfNotFound(String title, String author, int count, List<String> categoryNames) {
        if (bookRepository.findByTitleContainingIgnoreCase(title).isEmpty()) {

            Book book = new Book();
            book.setTitle(title);
            book.setAuthor(author);
            book.setCount(count);

            for (String catName : categoryNames) {
                Category category = categoryRepository.findByName(catName)
                        .orElseGet(() -> categoryRepository.save(new Category(catName)));
                book.getCategories().add(category);
            }

            Book savedBook = bookRepository.save(book);

            List<BookItem> items = new ArrayList<>();
            for (int i = 1; i <= count; i++) {
                BookItem item = new BookItem();
                item.setBook(savedBook);
                item.setIsAvailable(true);
                String shortTitle = title.substring(0, Math.min(title.length(), 3)).toUpperCase();
                item.setIsbn("ISBN-" + shortTitle + "-" + i);
                items.add(item);
            }
            bookItemRepository.saveAll(items);
        }
    }

    @Transactional
    public void seedUsersAndRentals() {
        if (userRepository.count() > 5) {
            return;
        }

        Faker faker = new Faker(new java.util.Locale("pl"));
        Random random = new Random();

        // Pobieramy potrzebne dane globalne
        Role userRole = roleRepository.findByRoleName("USER").orElseThrow();
        List<Category> allCategories = categoryRepository.findAll();
        List<Book> allBooks = bookRepository.findAll();

        // opinie do losowania
        List<String> positiveReviews = List.of(
                "Świetna lektura!",
                "Nie mogłem się oderwać, pochłonąłem w jeden wieczór.",
                "Polecam każdemu, kto szuka czegoś ambitnego.",
                "Absolutne arcydzieło, na pewno do niej wrócę.",
                "Warto przeczytać, daje dużo do myślenia.",
                "Genialnie zarysowani bohaterowie, czułem ich emocje.",
                "Jedna z najlepszych książek, jakie miałem w rękach w tym roku.",
                "Styl autora jest niesamowity, bardzo lekko się czyta.",
                "Niesamowity zwrot akcji na końcu! Totalne zaskoczenie.",
                "Bardzo inspirująca pozycja, zmieniła moje spojrzenie na niektóre sprawy.",
                "Piękna opowieść, wzruszyłem się kilka razy.",
                "Idealna na prezent dla każdego mola książkowego.",
                "Wciągająca od pierwszej strony, trzyma w napięciu do samego końca."
        );

        List<String> neutralReviews = List.of(
                "Może być, choć szału nie ma.",
                "Spodziewałem się czegoś więcej po tylu dobrych opiniach.",
                "Dobra, ale momentami trochę się dłużyła.",
                "Przeczytałem, ale bez większego zachwytu.",
                "Poprawna książka, ale raczej szybko o niej zapomnę.",
                "Interesujący pomysł, ale wykonanie mogłoby być lepsze.",
                "Średnia pozycja, taka typowa 'na raz'.",
                "Początek był świetny, ale końcówka mnie rozczarowała.",
                "Trochę zbyt przewidywalna fabuła, ale język bardzo ładny.",
                "Dla fanów gatunku będzie OK, dla reszty może być nudna.",
                "Mieszane uczucia – niektóre wątki świetne, inne niepotrzebne.",
                "Solidne rzemiosło, ale brakuje 'tego czegoś'."
        );

        List<String> negativeReviews = List.of(
                "Nuda. Ledwo przebrnąłem przez pierwsze rozdziały.",
                "Strata czasu, kompletnie nie rozumiem fenomenu tej książki.",
                "Nie dotrwałem do końca, styl autora mnie odrzucił.",
                "Bardzo ciężko się czyta, język jest strasznie toporny.",
                "Postacie są płaskie i irytujące, nie polecam.",
                "Chaos, brak logiki i naciągana fabuła.",
                "Szkoda pieniędzy i czasu, najgorsza książka w tym miesiącu.",
                "Bardzo naiwna historia, napisana jakby na kolanie.",
                "Strasznie się wynudziłem, nic się nie działo przez 200 stron.",
                "Kompletne rozczarowanie, autor zmarnował świetny potencjał.",
                "Czuję niedosyt i irytację, nie tego oczekiwałem.",
                "Zbyt dużo opisów, za mało akcji. Bardzo męcząca lektura."
        );

        if (allBooks.isEmpty()) return;

        List<User> usersToSave = new ArrayList<>();
        List<Rentals> rentalsToSave = new ArrayList<>();
        List<Review> reviewsToSave = new ArrayList<>();

        for (int i = 1; i <= 50; i++) {
            User user = new User();
            user.setUsername("user" + i);
            user.setPassword(passwordEncoder.encode("password" + i));
            user.setEmail("user" + i + "@library.com");
            user.setFirstName(faker.name().firstName());
            user.setLastName(faker.name().lastName());
            user.setPhoneNumber(faker.phoneNumber().cellPhone());
            user.addRole(userRole);

            // Zapisujemy usera od razu, żeby mieć ID do wypożyczeń
            user = userRepository.save(user);
            usersToSave.add(user);

            // Ulubiona Kategoria
            Category favoriteCategory = allCategories.get(random.nextInt(allCategories.size()));
            List<Book> favoriteBooks = allBooks.stream()
                    .filter(b -> b.getCategories().contains(favoriteCategory))
                    .collect(Collectors.toList());

            // Losowa Liczba wypożyczeń
            int rentalsCount = random.nextInt(41) + 10;

            Set<Long> reviewedBookIds = new HashSet<>();

            for (int r = 0; r < rentalsCount; r++) {
                Book selectedBook;

                // 50% szans na ulubioną kategorię
                boolean useFavorite = random.nextBoolean() && !favoriteBooks.isEmpty();

                if (useFavorite) {
                    selectedBook = favoriteBooks.get(random.nextInt(favoriteBooks.size()));
                } else {
                    selectedBook = allBooks.get(random.nextInt(allBooks.size()));
                }

                // Pobieramy dowolny egzemplarz tej książki (BookItem)
                List<BookItem> items = bookItemRepository.findByBookAndIsAvailableTrue(selectedBook);
                if (items.isEmpty()) continue;

                BookItem item = items.get(random.nextInt(items.size()));

                // Tworzenie wypożyczenia (Rental)
                Rentals rental = new Rentals();
                rental.setUser(user);
                rental.setBookItem(item);

                // Ustawiamy daty w przeszłości (symulacja historii)
                LocalDate startDate = LocalDate.now().minusDays(random.nextInt(365) + 30);
                LocalDate endDate = startDate.plusDays(random.nextInt(25) + 5);

                rental.setStartDate(startDate);
                rental.setEndDate(endDate);
                rental.setStatus("RETURNED");

                rentalsToSave.add(rental);

                if (!reviewedBookIds.contains(selectedBook.getId())) {
                    Review review = new Review();
                    review.setUser(user);
                    review.setBook(selectedBook);

                    // Losowanie oceny i opisu zależnie od "szczęścia"
                    int rating = random.nextInt(5) + 1; // 1-5
                    review.setRating(rating);

                    String desc;
                    if (rating >= 4) desc = positiveReviews.get(random.nextInt(positiveReviews.size()));
                    else if (rating == 3) desc = neutralReviews.get(random.nextInt(neutralReviews.size()));
                    else desc = negativeReviews.get(random.nextInt(negativeReviews.size()));

                    review.setDescription(desc);

                    // Data wystawienia recenzji = data zwrotu książki
                    review.setCreatedAt(endDate.atStartOfDay().plusHours(random.nextInt(12) + 8));

                    reviewsToSave.add(review);
                    reviewedBookIds.add(selectedBook.getId());
                }
            }
        }

        rentalsRepository.saveAll(rentalsToSave);
        reviewRepository.saveAll(reviewsToSave);
        System.out.println("Zakończono generowanie użytkowników i wypożyczeń.");
    }
}