package pl.agh.edu.libraryapp.book;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.agh.edu.libraryapp.book.Category;
import pl.agh.edu.libraryapp.book.repositories.CategoryRepository;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/category")
public class CategoryController {
    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategory(@PathVariable Long id) {
        Optional<Category> category = categoryRepository.findById(id);
        return category.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        try {
            Optional<Category> existing = categoryRepository.findByName(category.getName());
            if (existing.isPresent()) {
                return ResponseEntity.badRequest().body("Kategoria o tej nazwie już istnieje");
            }

            Category savedCategory = categoryRepository.save(category);
            return ResponseEntity.ok(savedCategory);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Category categoryDetails) {
        try {
            Optional<Category> categoryOpt = categoryRepository.findById(id);
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Category category = categoryOpt.get();

            Optional<Category> existing = categoryRepository.findByName(categoryDetails.getName());
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("Kategoria o tej nazwie już istnieje");
            }

            category.setName(categoryDetails.getName());
            Category updatedCategory = categoryRepository.save(category);
            return ResponseEntity.ok(updatedCategory);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            Optional<Category> categoryOpt = categoryRepository.findById(id);
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            categoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Nie można usunąć kategorii: " + e.getMessage());
        }
    }
}