<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Encrypts existing edge_secret values at rest.
     * New secrets will be encrypted on creation.
     */
    public function up(): void
    {
        if (Schema::hasTable('edge_servers') && Schema::hasColumn('edge_servers', 'edge_secret')) {
            // Encrypt existing plaintext secrets
            $edgeServers = DB::table('edge_servers')
                ->whereNotNull('edge_secret')
                ->where('edge_secret', '!=', '')
                ->get();
            
            foreach ($edgeServers as $server) {
                $plainSecret = $server->edge_secret;
                
                // Check if already encrypted (starts with 'eyJ' for base64 JSON)
                if (!str_starts_with($plainSecret, 'eyJ')) {
                    // Encrypt the secret
                    $encrypted = Crypt::encryptString($plainSecret);
                    
                    DB::table('edge_servers')
                        ->where('id', $server->id)
                        ->update(['edge_secret' => $encrypted]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     * 
     * WARNING: Decryption may fail if encryption key changed.
     */
    public function down(): void
    {
        // Note: Decryption is risky if encryption key changed
        // This migration is one-way for security
        // If you need to decrypt, do it manually with the correct key
    }
};
