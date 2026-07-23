package com.oasixlab.fitpro.ui.home

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material.icons.filled.Construction
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.oasixlab.fitpro.R
import com.oasixlab.fitpro.data.api.User
import com.oasixlab.fitpro.ui.client.ClientProfileTab
import com.oasixlab.fitpro.ui.client.KnowledgeTab
import com.oasixlab.fitpro.ui.client.MeasurementsTab
import com.oasixlab.fitpro.ui.client.TasksTab
import com.oasixlab.fitpro.ui.client.WorkoutsTab
import com.oasixlab.fitpro.ui.common.OasixPillNav
import com.oasixlab.fitpro.ui.common.PillTab
import com.oasixlab.fitpro.ui.trainer.ClientsTab
import com.oasixlab.fitpro.ui.trainer.DashboardTab
import com.oasixlab.fitpro.ui.trainer.ReviewTab
import com.oasixlab.fitpro.ui.trainer.StudioTab
import com.oasixlab.fitpro.ui.trainer.TrainerProfileTab

/** Кабинет клиента — плавающий пилл-навбар oasix поверх контента. */
@Composable
fun ClientHomeScreen(user: User, onLogout: () -> Unit) {
    var selected by rememberSaveable { mutableIntStateOf(0) }

    val tabs = listOf(
        PillTab("Дневник", painter = painterResource(R.drawable.ic_fit_gym)),
        PillTab("Замеры", icon = Icons.Default.ShowChart),
        PillTab("Задачи", icon = Icons.Default.Checklist),
        PillTab("Материалы", icon = Icons.AutoMirrored.Filled.MenuBook),
        PillTab("Профиль", icon = Icons.Default.Person),
    )

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            OasixPillNav(
                tabs = tabs,
                selected = selected,
                onSelect = { selected = it },
                modifier = Modifier.navigationBarsPadding().padding(bottom = 10.dp),
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            androidx.compose.animation.Crossfade(targetState = selected, label = "clientTab") { s ->
                when (s) {
                    0 -> WorkoutsTab()
                    1 -> MeasurementsTab()
                    2 -> TasksTab()
                    3 -> KnowledgeTab()
                    else -> ClientProfileTab(user, onLogout)
                }
            }
        }
    }
}

/** Кабинет тренера — тот же плавающий пилл-навбар oasix, что и у клиента. */
@Composable
fun TrainerHomeScreen(user: User, onLogout: () -> Unit) {
    var selected by rememberSaveable { mutableIntStateOf(0) }

    val tabs = listOf(
        PillTab("Дашборд", icon = Icons.Default.Dashboard),
        PillTab("Клиенты", icon = Icons.Default.Group),
        PillTab("Проверка", icon = Icons.Default.Description),
        PillTab("Студия", icon = Icons.Default.Construction),
        PillTab("Профиль", icon = Icons.Default.Person),
    )

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            OasixPillNav(
                tabs = tabs,
                selected = selected,
                onSelect = { selected = it },
                modifier = Modifier.navigationBarsPadding().padding(bottom = 10.dp),
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            androidx.compose.animation.Crossfade(targetState = selected, label = "trainerTab") { s ->
                when (s) {
                    0 -> DashboardTab()
                    1 -> ClientsTab()
                    2 -> ReviewTab()
                    3 -> StudioTab()
                    else -> TrainerProfileTab(user, onLogout)
                }
            }
        }
    }
}
