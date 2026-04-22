<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'user', schema: 'forum')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_USERNAME', fields: ['username'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    /**
     * @var non-empty-string
     */
    #[ORM\Column(length: 180)]
    private string $username;

    /**
     * @var list<string> The user roles
     */
    #[ORM\Column]
    private array $roles = [];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    private string $password;

    /**
     * @var Collection<int, Post>
     */
    #[ORM\OneToMany(targetEntity: Post::class, mappedBy: 'author')]
    private Collection $posts;

    /**
     * @var Collection<int, UserCombo>
     */
    #[ORM\OneToMany(targetEntity: UserCombo::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $userCombos;

    #[ORM\OneToOne(mappedBy: 'user', cascade: ['persist', 'remove'])]
    private ?UserScenarioPreference $scenarioPreference = null;

    public function __construct()
    {
        $this->posts = new ArrayCollection();
        $this->userCombos = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    /**
     * @return non-empty-string
     */
    public function getUsername(): string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        if ("" === $username) {
            throw new \ValueError("You are trying to set up a user with empty username!");
        }
        $this->username = $username;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @return non-empty-string
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return $this->username;
    }

    /**
     * @return array<string>
     * @see UserInterface
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * @see UserInterface
     */
    public function eraseCredentials(): void
    {
        // If you store any temporary, sensitive data on the user, clear it here
        // $this->plainPassword = null;
    }

    /**
     * @return Collection<int, Post>
     */
    public function getPosts(): Collection
    {
        return $this->posts;
    }

    public function addPost(Post $post): static
    {
        if (!$this->posts->contains($post)) {
            $this->posts->add($post);
            $post->setAuthor($this);
        }

        return $this;
    }

    public function removePost(Post $post): static
    {
        if ($this->posts->removeElement($post)) {
            // set the owning side to null (unless already changed)
            if ($post->getAuthor() === $this) {
                $post->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, UserCombo>
     */
    public function getUserCombos(): Collection
    {
        return $this->userCombos;
    }

    public function addUserCombo(UserCombo $userCombo): static
    {
        if (!$this->userCombos->contains($userCombo)) {
            $this->userCombos->add($userCombo);
            $userCombo->setUser($this);
        }

        return $this;
    }

    public function removeUserCombo(UserCombo $userCombo): static
    {
        if ($this->userCombos->removeElement($userCombo)) {
            // set the owning side to null (unless already changed)
            if ($userCombo->getUser() === $this) {
                $userCombo->setUser(null);
            }
        }

        return $this;
    }

    public function getScenarioPreference(): ?UserScenarioPreference
    {
        return $this->scenarioPreference;
    }

    public function setScenarioPreference(?UserScenarioPreference $scenarioPreference): static
    {
        if (null !== $scenarioPreference && $scenarioPreference->getUser() !== $this) {
            $scenarioPreference->setUser($this);
        }

        $this->scenarioPreference = $scenarioPreference;

        return $this;
    }
}
