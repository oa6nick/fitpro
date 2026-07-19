package com.oasixlab.fitpro.data.auth

/**
 * Токен сессии в памяти для синхронного доступа из Compose (сборка URL картинок
 * и ссылок на файлы с ?token=, т.к. Coil/Intent заголовок Bearer не добавляют).
 * Обновляется в AuthRepository при логине/восстановлении/логауте.
 */
object SessionToken {
    @Volatile
    var value: String? = null
}
