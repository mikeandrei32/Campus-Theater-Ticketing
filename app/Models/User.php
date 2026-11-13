<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'role', 'registered_via', 'student_number', 'password', 'api_token', 'email_verified_at'])]
#[Hidden(['password', 'remember_token', 'api_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public static function isStudentDomainEmail(?string $email): bool
    {
        return str_ends_with(strtolower(trim((string) $email)), '@student.mseuf.edu.ph');
    }

    public function hasStudentDomainEmail(): bool
    {
        return self::isStudentDomainEmail($this->email);
    }

    public function isAdmin(): bool
    {
        if ($this->hasStudentDomainEmail() || ($this->registered_via ?? 'web') === 'mobile') {
            return false;
        }

        return $this->role === 'admin';
    }

    public function canManageTheater(): bool
    {
        return ! $this->hasStudentDomainEmail() && ! $this->isMobileAccount();
    }

    public function isMobileAccount(): bool
    {
        return ($this->registered_via ?? 'web') === 'mobile' || $this->hasStudentDomainEmail();
    }

    public function isWebAccount(): bool
    {
        return ! $this->isMobileAccount();
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
