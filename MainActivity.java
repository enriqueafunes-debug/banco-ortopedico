package org.rotary.bancoortopedico;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private WebView webView;
    @SuppressLint({"SetJavaScriptEnabled","JavascriptInterface"})
    @Override public void onCreate(Bundle b){super.onCreate(b);webView=new WebView(this);setContentView(webView);WebSettings s=webView.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(true);s.setAllowContentAccess(true);webView.addJavascriptInterface(new Bridge(),"Android");webView.setWebViewClient(new WebViewClient());webView.setWebChromeClient(new WebChromeClient());webView.loadUrl("file:///android_asset/index.html");}
    public class Bridge {
        @JavascriptInterface public void openWhatsApp(String phone,String message){runOnUiThread(()->{try{String p=phone.replaceAll("[^0-9]","");if(p.startsWith("0"))p=p.substring(1);if(!p.startsWith("54"))p="54"+p;Uri uri=Uri.parse("https://wa.me/"+p+"?text="+Uri.encode(message));startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception e){Toast.makeText(MainActivity.this,"No se pudo abrir WhatsApp",Toast.LENGTH_LONG).show();}});}
        @JavascriptInterface public void saveTextFile(String name,String content,String mime){try{File dir=Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);if(!dir.exists())dir.mkdirs();File f=new File(dir,name);try(FileOutputStream out=new FileOutputStream(f)){out.write(content.getBytes(StandardCharsets.UTF_8));}runOnUiThread(()->Toast.makeText(MainActivity.this,"Guardado en Descargas: "+name,Toast.LENGTH_LONG).show());}catch(Exception e){runOnUiThread(()->Toast.makeText(MainActivity.this,"No se pudo guardar el archivo",Toast.LENGTH_LONG).show());}}
        @JavascriptInterface public void printPage(){runOnUiThread(()->{PrintManager pm=(PrintManager)getSystemService(PRINT_SERVICE);pm.print("Reporte Banco Ortopedico",webView.createPrintDocumentAdapter("Reporte Banco Ortopedico"),new PrintAttributes.Builder().build());});}
    }
    @Override public void onBackPressed(){if(webView!=null&&webView.canGoBack())webView.goBack();else super.onBackPressed();}
}
