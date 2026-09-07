package com.bingoplinko.game;

import android.accounts.Account;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.ClearTokenRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.Scope;
import java.util.Collections;

@CapacitorPlugin(name = "DriveSession")
public class DriveSessionPlugin extends Plugin {
    @PluginMethod
    public void resume(PluginCall call) {
        String email = call.getString("email");
        if (email == null || email.isEmpty()) {
            call.reject("Entre com Google novamente.", "AUTH_REQUIRED");
            return;
        }
        AuthorizationRequest request = AuthorizationRequest.builder()
            .setAccount(new Account(email, "com.google"))
            .setRequestedScopes(Collections.singletonList(new Scope("https://www.googleapis.com/auth/drive.appdata")))
            .build();
        Identity.getAuthorizationClient(getActivity()).authorize(request)
            .addOnSuccessListener(result -> {
                // Never launch consent or account selection in the background.
                if (result.hasResolution() || result.getAccessToken() == null) {
                    call.reject("Confirme sua conta Google.", "AUTH_REQUIRED");
                    return;
                }
                JSObject data = new JSObject();
                data.put("accessToken", result.getAccessToken());
                call.resolve(data);
            })
            .addOnFailureListener(error -> call.reject("Sessão Google indisponível.", "AUTH_UNAVAILABLE", error));
    }

    @PluginMethod
    public void invalidate(PluginCall call) {
        String token = call.getString("accessToken");
        if (token == null) { call.resolve(); return; }
        Identity.getAuthorizationClient(getActivity())
            .clearToken(ClearTokenRequest.builder().setToken(token).build())
            .addOnSuccessListener(result -> call.resolve())
            .addOnFailureListener(error -> call.reject("Não foi possível renovar a sessão.", error));
    }
}
