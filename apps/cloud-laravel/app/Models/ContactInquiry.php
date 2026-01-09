<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

class ContactInquiry extends BaseModel
{
    use SoftDeletes;

    protected $table = 'contact_inquiries';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'message',
        'source',
        'status',
        'read_at',
        'admin_notes',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];
}

