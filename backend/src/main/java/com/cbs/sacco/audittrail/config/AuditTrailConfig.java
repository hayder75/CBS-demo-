package com.cbs.sacco.audittrail.config;

import com.cbs.sacco.audittrail.listener.AuditTrailEventListener;
import org.hibernate.boot.Metadata;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.integrator.spi.Integrator;
import org.hibernate.jpa.boot.spi.IntegratorProvider;
import org.hibernate.service.spi.SessionFactoryServiceRegistry;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
public class AuditTrailConfig implements HibernatePropertiesCustomizer {

    private final AuditTrailEventListener listener;

    public AuditTrailConfig(AuditTrailEventListener listener) {
        this.listener = listener;
    }

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put("hibernate.integrator_provider", (IntegratorProvider) () -> List.of(new Integrator() {
            @Override
            public void integrate(Metadata metadata, SessionFactoryImplementor sessionFactory,
                                  SessionFactoryServiceRegistry serviceRegistry) {
                EventListenerRegistry registry = serviceRegistry.getService(EventListenerRegistry.class);
                registry.appendListeners(EventType.POST_INSERT, listener);
                registry.appendListeners(EventType.POST_UPDATE, listener);
                registry.appendListeners(EventType.POST_DELETE, listener);
            }

            @Override
            public void disintegrate(SessionFactoryImplementor sessionFactory,
                                     SessionFactoryServiceRegistry serviceRegistry) {
            }
        }));
    }
}
